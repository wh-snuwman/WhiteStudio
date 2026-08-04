export class core {
    constructor(canvas) {
        // WebGL2 컨텍스트 선언
        this.gl = canvas.getContext("webgl2");
        if (!this.gl) throw new Error("WebGL2를 지원하지 않는 브라우저입니다.");

        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // WebGL2 버전에 맞춘 버텍스 셰이더 (GLSL ES 300)
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            in vec2 a_texcoord;
            uniform vec2 u_resolution;
            out vec2 v_texcoord;

            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;

                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                v_texcoord = a_texcoord;
            }
        `;

        // WebGL2 버전에 맞춘 프래그먼트 셰이더 (GLSL ES 300)
        const fragmentShaderSource = `#version 300 es
            precision mediump float;

            in vec2 v_texcoord;
            uniform sampler2D u_texture;
            uniform vec4 u_color;
            uniform float u_alpha;
            
            out vec4 outColor;

            void main() {
                vec4 tex = texture(u_texture, v_texcoord);
                
                // 1. 원본 텍스처와 fillColor(u_color)의 RGB 결합
                vec3 combinedColor = tex.rgb * u_color.rgb;
                
                // 2. 최종 알파값 계산 (텍스처 알파 * fillColor 알파 * 글로벌 알파)
                float finalAlpha = tex.a * u_color.a * u_alpha;
                
                // 3. 프리멀티플라이드 알파 블렌딩 규격 적용
                vec3 premultipliedRGB = combinedColor * u_color.a * u_alpha;
                
                outColor = vec4(premultipliedRGB, finalAlpha);
            }
        `;

        const vertexShader = this._compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this._createProgram(vertexShader, fragmentShader);
        gl.useProgram(this.program);

        this.positionLocation = gl.getAttribLocation(this.program, "a_position");
        this.texcoordLocation = gl.getAttribLocation(this.program, "a_texcoord");
        this.resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
        this.alphaLocation = gl.getUniformLocation(this.program, "u_alpha");

        this.positionBuffer = gl.createBuffer();
        this.texcoordBuffer = gl.createBuffer();
        this.dpr = 1;
        this.images = [];

        this.atlasSize = 1024; // 아틀라스 캔버스 해상도
        this.atlasCanvas = document.createElement('canvas');
        this.atlasCanvas.width = this.atlasSize;
        this.atlasCanvas.height = this.atlasSize;
        this.ctx = this.atlasCanvas.getContext('2d', { willReadFrequently: true });

        this.atlasTexture = gl.createTexture();
        this.initAtlasTexture();

        // drawImage 내부에서 사용할 아틀라스 텍스처 객체 래퍼
        this.fontAtlasTexture = {
            texture: this.atlasTexture,
            isVideo: false,
            width: this.atlasSize,
            height: this.atlasSize
        };

        // 글자별 UV 위치 데이터 및 포인터 관리
        this.glyphCache = new Map(); // key: `${char}_${fontStr}`
        this.atlasCursorX = 0;
        this.atlasCursorY = 0;
        this.maxRowHeight = 0;
    }


    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    _createProgram(vs, fs) {
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        return program;
    }

    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;

            img.onload = async () => {
                try {
                    await img.decode();
                    const texture = this.gl.createTexture();
                    const gl = this.gl;
                    
                    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    const imageObj = { texture, isVideo: false, width: img.width, height: img.height };
                    this.images.push(imageObj);
                    resolve(imageObj);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(e);
        });
    }

    drawImage(image, x, y, w, h, vertex_ = null, texcoord_ = null, fillColor_ = null, alpha_ = 1.0) {
        const gl = this.gl;
        
        // 1. 객체/배열 형태의 오버로딩 파라미터 방어적 처리
        if (Array.isArray(x)) {
            alpha_ = fillColor_ ?? 1.0;
            fillColor_ = texcoord_;
            texcoord_ = w;
            w = y[0];
            h = y[1];
            y = x[1];
            x = x[0];
        }

        // Raw WebGLTexture가 직접 들어온 경우 래핑
        const imgObj = (image && image.texture) ? image : { texture: image, isVideo: false };

        if (imgObj.isVideo && imgObj.video && imgObj.video.readyState >= imgObj.video.HAVE_CURRENT_DATA) {
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, imgObj.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgObj.video);
        }

        let targetAlpha = alpha_;
        if (targetAlpha > 1.0) {
            targetAlpha = targetAlpha / 255.0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        if (vertex_ == null) {
            const x1 = x;
            const y1 = y;
            const x2 = x + w;
            const y2 = y + h;
            vertex_ = [x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2];
        }

        const positions = new Float32Array(vertex_);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        if (texcoord_ == null) {
            texcoord_ = [
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0
            ];
        } else if (texcoord_.length === 4) {
            // [u1, v1, u2, v2] 형태의 UV 영역 배열 대응
            const [u1, v1, u2, v2] = texcoord_;
            texcoord_ = [
                u1, v1,
                u2, v1,
                u1, v2,
                u1, v2,
                u2, v1,
                u2, v2
            ];
        }

        const texcoords = new Float32Array(texcoord_);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.texcoordLocation);
        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);

        // fillColor_ 배열 요소 정규화 처리
        if (fillColor_ != null) {
            let r = fillColor_[0];
            let g = fillColor_[1];
            let b = fillColor_[2];
            let a = fillColor_[3] !== undefined ? fillColor_[3] : 1.0;

            if (r > 1.0 || g > 1.0 || b > 1.0 || a > 1.0) {
                r /= 255.0;
                g /= 255.0;
                b /= 255.0;
                a /= 255.0;
            }
            gl.uniform4f(this.colorLocation, r, g, b, a);
        } else {
            gl.uniform4f(this.colorLocation, 1.0, 1.0, 1.0, 1.0);
        }
        gl.uniform1f(this.alphaLocation, targetAlpha);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.bindTexture(gl.TEXTURE_2D, imgObj.texture);
        gl.drawArrays(gl.TRIANGLES, 0, (vertex_.length / 2));
    }

    clear(r = 0, g = 0, b = 0, a = 1) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resizeCanvas() {
        this.dpr = window.devicePixelRatio || 1;
        const displayWidth  = Math.floor(this.gl.canvas.clientWidth  * this.dpr);
        const displayHeight = Math.floor(this.gl.canvas.clientHeight * this.dpr);
        if (this.gl.canvas.width !== displayWidth || this.gl.canvas.height !== displayHeight) {
            this.gl.canvas.width  = displayWidth;
            this.gl.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
            return true;
        }
        return false;
    }

   initAtlasTexture() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        // 빈 1024x1024 텍스처 할당
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.atlasSize, this.atlasSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        // 안티앨리어싱을 위해 LINEAR 필터 사용
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    _cacheGlyph(char, fontStr, sizeNum) {
        const key = `${char}_${fontStr}`;
        if (this.glyphCache.has(key)) {
            return this.glyphCache.get(key);
        }

        this.ctx.font = fontStr;
        this.ctx.fillStyle = 'white';
        this.ctx.textBaseline = 'top';

        const metrics = this.ctx.measureText(char);
        const w = Math.max(1, Math.ceil(metrics.width));
        const h = Math.ceil(sizeNum * 1.4); // 폰트 높이 여유 확보

        // 줄바꿈 검사
        if (this.atlasCursorX + w > this.atlasSize) {
            this.atlasCursorX = 0;
            this.atlasCursorY += this.maxRowHeight + 2;
            this.maxRowHeight = 0;
        }

        // 아틀라스 크기(1024) 초과 방지
        if (this.atlasCursorY + h > this.atlasSize) {
            console.warn("Font Atlas 공간 부족");
            return null;
        }

        // 2D 캔버스 해당 영역 지우고 글자 그리기
        this.ctx.clearRect(this.atlasCursorX, this.atlasCursorY, w, h);
        this.ctx.fillText(char, this.atlasCursorX, this.atlasCursorY);

        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        // [중요 수정] CanvasElement 인자 형태일 때는 xoffset, yoffset만 지정해야 오버플로우가 안 납니다!
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0, 0, // xoffset, yoffset (캔버스 전체 1024x1024 업로드)
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.atlasCanvas
        );

        const glyphInfo = {
            width: w,
            height: h,
            u1: this.atlasCursorX / this.atlasSize,
            v1: this.atlasCursorY / this.atlasSize,
            u2: (this.atlasCursorX + w) / this.atlasSize,
            v2: (this.atlasCursorY + h) / this.atlasSize
        };

        this.glyphCache.set(key, glyphInfo);

        this.atlasCursorX += w + 2;
        this.maxRowHeight = Math.max(this.maxRowHeight, h);

        return glyphInfo;
    }

    text(text, pos = [0, 0], size = '20px', color = 'black', font = null, align = 'left') {
        if (!text) return;

        const sizeNum = Math.round(convertToPx(size));
        const fontName = (typeof font === 'string') ? font : 'serif';
        const fontStr = `${sizeNum}px ${fontName}`;

        let totalWidth = 0;
        const glyphsToDraw = [];

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const glyph = this._cacheGlyph(char, fontStr, sizeNum);
            if (glyph) {
                glyphsToDraw.push(glyph);
                totalWidth += glyph.width;
            }
        }

        let startX = pos[0];
        if (align === 'center') {
            startX -= totalWidth / 2;
        } else if (align === 'right') {
            startX -= totalWidth;
        }

        const colorRGB = this._parseColor(color);

        let currentX = startX;
        const currentY = pos[1];

        for (let i = 0; i < glyphsToDraw.length; i++) {
            const glyph = glyphsToDraw[i];

            this.drawImage(
                this.fontAtlasTexture,
                currentX,
                currentY,
                glyph.width,
                glyph.height,
                null,
                [glyph.u1, glyph.v1, glyph.u2, glyph.v2],
                colorRGB
            );

            currentX += glyph.width;
        }
    }

    _parseColor(colorStr) {
        if (Array.isArray(colorStr)) {
            return colorStr;
        }

        if (!this._colorCtx) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            this._colorCtx = canvas.getContext('2d', { willReadFrequently: true });
        }

        this._colorCtx.fillStyle = colorStr;
        this._colorCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = this._colorCtx.getImageData(0, 0, 1, 1).data;

        return [r / 255, g / 255, b / 255, a / 255];
    }
}

function convertToPx(sizeStr, baseFontSize = 16) {
    const match = String(sizeStr).match(/^([0-9.]+)\s*([a-z%]*)$/i);
    if (!match) return 20;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'px').toLowerCase();

    switch (unit) {
        case 'rem':
            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            return value * rootFontSize;
            
        case 'em':
            return value * baseFontSize;
            
        case 'pt':
            return value * 1.333;
            
        case 'vh':
            return (value * window.innerHeight) / 100;
            
        case 'vw':
            return (value * window.innerWidth) / 100;
            
        case 'px':
        default:
            return value;
    }
}