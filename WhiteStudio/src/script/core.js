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
        this.textCanvas = document.createElement('canvas');
        this.ctx = this.textCanvas.getContext('2d');
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
                    const imageObj = { texture, width: img.width, height: img.height };
                    this.images.push(imageObj);
                    resolve(imageObj);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(e);
        });
    }

    drawImage(image, x, y, w, h, vertex_=null, texcoord_=null, fillColor_=null, alpha_=1.0) {
        const gl = this.gl;
        
        if (image.isVideo && image.video.readyState >= image.video.HAVE_CURRENT_DATA) {
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, image.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.video);
        }

        let targetAlpha = alpha_;
        if (targetAlpha > 1.0) {
            targetAlpha = targetAlpha / 255.0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        if (vertex_ == null){
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
        if (texcoord_ == null){
            const u1 = 0.0;
            const v1 = 0.0;
            const u2 = 1.0;
            const v2 = 1.0;
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

        // fillColor_ 배열 요소가 0~255 범위인 경우 0.0~1.0 범위로 정규화 처리
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
        
        gl.bindTexture(gl.TEXTURE_2D, image.texture);
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

    text(text, pos = [0, 0], size = '20px', color = 'black', font = null, align = 'left') {
        if (!this.ctx) return;
        const fontStr = (typeof font === 'string') ? `${size} ${font}` : `${size} serif`;
        this.ctx.font = fontStr;
        const metrics = this.ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = Math.ceil(parseInt(size) * 1.4);

        if (textWidth === 0 || textHeight === 0) return;

        this.textCanvas.width = textWidth;
        this.textCanvas.height = textHeight;

        this.ctx.font = fontStr;
        this.ctx.fillStyle = color;
        this.ctx.textBaseline = 'middle';
        
        let textX = 0;
        if (align === 'center') textX = textWidth / 2;
        else if (align === 'right') textX = textWidth;
        this.ctx.textAlign = align;

        this.ctx.clearRect(0, 0, textWidth, textHeight);
        this.ctx.fillText(text, textX, textHeight / 2);

        const gl = this.gl;
        const texture = gl.createTexture();
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        this.drawImage({ texture }, pos[0], pos[1], textWidth, textHeight);
        gl.deleteTexture(texture);
    }
}