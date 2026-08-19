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
        // 텍스처와 유니폼 컬러 모두 프리멀티플라이드 알파를 가정한다.
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

        // GC 방지를 위한 재사용 버퍼 배열.
        // 정점 6개 x 2차원 = quad 1개당 12 float. maxBatchQuads개의 quad를
        // 한 번의 draw call로 그릴 수 있도록 그만큼 큰 스크래치 공간을 마련해둔다.
        // (텍스트 배칭에서 사용: 글자 하나당 draw call을 내지 않고 한 번에 그리기 위함)
        this.maxBatchQuads = 512;
        this.posArray = new Float32Array(this.maxBatchQuads * 12);
        this.texArray = new Float32Array(this.maxBatchQuads * 12);

        // 버퍼는 최대 배치 크기만큼 저장 공간만 예약해둔다. 실제 값은 매 draw
        // 직전 bufferSubData로 "이번에 쓸 만큼만" 채우고, drawArrays도 그만큼만
        // 읽도록 count를 맞추기 때문에 미사용 영역이 화면에 나타날 일은 없다.
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.posArray.byteLength, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        this.texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.texArray.byteLength, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.texcoordLocation);
        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        this.dpr = 1;
        this.images = [];
        this.videos = []; // loadVideo로 생성된 비디오 텍스처 객체 추적 (dispose 시 일괄 정리용)

        // 폰트 아틀라스: 한글처럼 글자 종류가 많은 경우 1페이지로는 금방 꽉 차므로
        // 페이지가 가득 차면 리셋하는 대신 새 텍스처 페이지를 추가하는 멀티 페이지 구조를 쓴다.
        // (기존: 단일 아틀라스만 있어 가득 차면 전체를 지우고 처음부터 다시 그려야 했음)
        this.atlasSize = 1024; // 페이지 1장의 해상도
        this.maxAtlasPages = 8; // 페이지 상한 (메모리 보호용)
        this.atlasPages = [];
        this.colorCache = new Map(); // 색상 문자열 파싱 캐시
        this.glyphCache = new Map(); // key: `${char}_${fontStr}` → { pageIndex, ... }

        this._addAtlasPage();

        // 캔버스 크기 변화에 자동 대응.
        // (기존: resizeCanvas가 정의만 되고 어디서도 호출되지 않아 리사이즈 시 갱신 안 됨)
        this._resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this._resizeObserver.observe(canvas);
        this.resizeCanvas();
    }

    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(info);
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
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(info);
        }
        return program;
    }

    async loadImage(url) {
        const img = new Image();
        img.src = url;

        // decode()가 로드 완료와 디코딩을 모두 보장하므로 onload와 이중으로
        // 기다릴 필요가 없다. (기존: onload 콜백 안에서 다시 decode()를 대기)
        try {
            await img.decode();
        } catch (e) {
            throw new Error(`이미지 로드 실패: ${url}`);
        }

        const gl = this.gl;
        const texture = gl.createTexture();

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const imageObj = { texture, isVideo: false, width: img.width, height: img.height };
        this.images.push(imageObj);
        return imageObj;
    }

    // GPU 텍스처 메모리 해제. loadImage로 만든 이미지가 더 이상 필요 없을 때 호출한다.
    // (기존: images 배열에 계속 누적되기만 하고 해제 수단이 없어 장시간 사용 시 누수)
    disposeImage(imageObj) {
        if (!imageObj || !imageObj.texture) return;
        this.gl.deleteTexture(imageObj.texture);
        const idx = this.images.indexOf(imageObj);
        if (idx !== -1) this.images.splice(idx, 1);
    }

    // 비디오를 로드해 videoObj를 반환한다. 기본값(autoPlay: true)에서는 로드가
    // 끝나는 즉시 재생을 시작한다 - 재생 시점을 직접 제어하고 싶다면
    // { autoPlay: false }를 넘기고, 원하는 타이밍에 videoObj.play()를 호출하면 된다.
    // videoObj = { texture, isVideo:true, video, width, height, autoplayBlocked, play(), pause() }
    //
    // 처리 흐름:
    //   1) <video> 엘리먼트 생성, crossOrigin/음소거/인라인재생 등 자동재생에 필요한 속성 설정
    //   2) 'loadedmetadata'(가로/세로 등 메타데이터 확보)까지 대기
    //   3) autoPlay가 true일 때만 play() 시도 - 브라우저 자동재생 정책에 막히면
    //      예외를 던지지 않고 autoplayBlocked 플래그로 알려서, 이후 사용자
    //      제스처 시 videoObj.play()로 재시도 가능
    //   4) WebGL 텍스처를 만들고, 새 프레임이 준비될 때마다 자동으로 갱신되는
    //      프레임 루프(_startVideoFrameLoop)를 등록 - autoPlay: false여도 등록만
    //      해두고, 실제 재생이 시작되면(재생 시점과 무관하게) 자동으로 갱신된다
    async loadVideo(url, options = {}) {
        const {
            crossOrigin = 'anonymous',
            loop = true,
            muted = true,   // 자동재생 정책상 대부분의 브라우저는 음소거 상태여야 autoplay를 허용한다
            playsInline = true,
            autoPlay = true // false로 주면 로드만 하고 재생은 하지 않는다 (소리도 나지 않음)
        } = options;

        const video = document.createElement('video');
        video.crossOrigin = crossOrigin;
        video.loop = loop;
        video.muted = muted;
        video.playsInline = playsInline;
        video.preload = 'auto';
        video.src = url;

        // 메타데이터 로드 완료(가로/세로 크기 등 확정) 또는 로드 실패를 대기한다.
        await new Promise((resolve, reject) => {
            const cleanup = () => {
                video.removeEventListener('loadedmetadata', onLoaded);
                video.removeEventListener('error', onError);
            };
            const onLoaded = () => { cleanup(); resolve(); };
            const onError = () => { cleanup(); reject(new Error(`비디오 로드 실패: ${url}`)); };
            video.addEventListener('loadedmetadata', onLoaded, { once: true });
            video.addEventListener('error', onError, { once: true });
        });

        // autoPlay가 true일 때만 재생을 시도한다. 브라우저의 autoplay 정책
        // (NotAllowedError 등)에 막혀도 치명적 에러로 취급하지 않고, 재생 대기
        // 상태로 두어 앱이 사용자 제스처 이후 videoObj.play()를 다시 호출할 수 있게 한다.
        let autoplayBlocked = false;
        if (autoPlay) {
            try {
                await video.play();
            } catch (e) {
                autoplayBlocked = true;
                console.warn(`자동 재생이 차단되었습니다(${e.name}). 사용자 상호작용 이후 videoObj.play()를 호출해 재생을 시작하세요.`);
            }
        }

        const gl = this.gl;
        const texture = gl.createTexture();

        const videoObj = {
            texture,
            isVideo: true,
            video,
            width: video.videoWidth,
            height: video.videoHeight,
            autoplayBlocked,
            _rvfcHandle: null,
            _rafHandle: null,
            _onPlayForRaf: null,
            play: () => video.play(),
            pause: () => video.pause()
        };

        this.videos.push(videoObj);
        this._startVideoFrameLoop(videoObj);

        return videoObj;
    }

    // 비디오의 새 프레임이 준비될 때마다 텍스처를 갱신하는 루프를 시작한다.
    // requestVideoFrameCallback(rVFC)을 지원하면 그것을 우선 사용한다 - 브라우저가
    // 실제로 화면에 새 프레임을 표시하는 시점에만 콜백이 오므로, 정지 중이거나
    // 프레임이 안 바뀐 상태에서는 애초에 호출 자체가 없어 가장 효율적이다.
    // 미지원 환경(fallback)에서는 requestAnimationFrame으로 대체하되, 일시정지/종료
    // 상태에서는 루프를 멈춰 불필요한 폴링으로 CPU를 낭비하지 않게 한다.
    _startVideoFrameLoop(videoObj) {
        const gl = this.gl;
        const { video, texture } = videoObj;

        if (typeof video.requestVideoFrameCallback === 'function') {
            const onFrame = () => {
                updateVideoTexture(gl, texture, video);
                videoObj._rvfcHandle = video.requestVideoFrameCallback(onFrame);
            };
            videoObj._rvfcHandle = video.requestVideoFrameCallback(onFrame);
        } else {
            const loop = () => {
                if (video.paused || video.ended) {
                    videoObj._rafHandle = null;
                    return; // 재생 중이 아니면 폴링을 멈춘다. 재생 재개 시 'play' 리스너가 다시 시작한다.
                }
                updateVideoTexture(gl, texture, video);
                videoObj._rafHandle = requestAnimationFrame(loop);
            };

            videoObj._onPlayForRaf = () => {
                if (videoObj._rafHandle == null) {
                    videoObj._rafHandle = requestAnimationFrame(loop);
                }
            };
            video.addEventListener('play', videoObj._onPlayForRaf);

            if (!video.paused) {
                videoObj._rafHandle = requestAnimationFrame(loop);
            }
        }
    }

    // 비디오 리소스를 정지하고 해제한다. GPU 텍스처, 프레임 루프(rVFC/rAF),
    // 비디오 엘리먼트의 디코더/버퍼 리소스까지 모두 정리한다.
    // (요구사항: 비디오 정지/파기 시 메모리 누수 방지)
    disposeVideo(videoObj) {
        if (!videoObj) return;
        const { video, texture, _rvfcHandle, _rafHandle, _onPlayForRaf } = videoObj;

        if (_rvfcHandle != null && typeof video.cancelVideoFrameCallback === 'function') {
            video.cancelVideoFrameCallback(_rvfcHandle);
        }
        if (_rafHandle != null) {
            cancelAnimationFrame(_rafHandle);
        }
        if (_onPlayForRaf) {
            video.removeEventListener('play', _onPlayForRaf);
        }

        video.pause();
        video.removeAttribute('src');
        video.load(); // 디코더/내부 버퍼 등 브라우저가 쥐고 있던 리소스를 해제시킨다

        this.gl.deleteTexture(texture);

        const idx = this.videos.indexOf(videoObj);
        if (idx !== -1) this.videos.splice(idx, 1);
    }


    drawImage(image, x, y, w, h, vertex_ = null, texcoord_ = null, fillColor_ = null, alpha_ = 1.0, flip = [false,false]) {
        const gl = this.gl;

        // pos 형태 [x, y] 배열 오버로딩 지원: drawImage(image, [x, y], w, h, ...)
        // 각 뒷자리 인자를 명시적으로 한 칸씩 당겨온다 (기존의 ?? 시프트 방식은
        // 인자 개수가 정확히 일치하지 않으면 값이 잘못된 자리로 밀려 들어가는 버그가 있었음).
        if (Array.isArray(x)) {
            const pos = x;
            [x, y] = pos;
            w = arguments[1];
            h = arguments[2];
            vertex_ = arguments[3] ?? null;
            texcoord_ = arguments[4] ?? null;
            fillColor_ = arguments[5] ?? null;
            alpha_ = arguments[6] ?? 1.0;
        }

        // Raw WebGLTexture 대응
        const imgObj = (image && image.texture) ? image : { texture: image, isVideo: false };

        // 비디오 프레임 업로드는 여기서 하지 않는다. 같은 비디오를 한 프레임에
        // 여러 번 그리면(다른 위치에 반복 렌더 등) 매번 재업로드되어 낭비였다.
        // 대신 loadVideo()가 시작하는 별도의 프레임 루프(_startVideoFrameLoop)가
        // 새 프레임이 실제로 준비됐을 때만 updateVideoTexture()로 갱신해두므로,
        // 여기서는 이미 최신 상태인 텍스처를 그냥 바인딩만 하면 된다.

        const targetAlpha = alpha_ > 1.0 ? alpha_ / 255.0 : alpha_;

        // 버텍스 좌표 계산 및 전역 Float32Array 재사용
        if (vertex_ == null) {
            const x2 = x + w;
            const y2 = y + h;
            this.posArray[0] = x;  this.posArray[1] = y;
            this.posArray[2] = x2; this.posArray[3] = y;
            this.posArray[4] = x;  this.posArray[5] = y2;
            this.posArray[6] = x;  this.posArray[7] = y2;
            this.posArray[8] = x2; this.posArray[9] = y;
            this.posArray[10] = x2; this.posArray[11] = y2;
        } else {
            for (let i = 0; i < 12; i++) this.posArray[i] = vertex_[i];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.posArray, 0, 12);

        // UV 좌표 계산 및 전역 Float32Array 재사용
        if (texcoord_ == null) {
            this.texArray[0] = 0; this.texArray[1] = 0;
            this.texArray[2] = 1; this.texArray[3] = 0;
            this.texArray[4] = 0; this.texArray[5] = 1;
            this.texArray[6] = 0; this.texArray[7] = 1;
            this.texArray[8] = 1; this.texArray[9] = 0;
            this.texArray[10] = 1; this.texArray[11] = 1;
        } else if (texcoord_.length === 4) {
            const [u1, v1, u2, v2] = texcoord_;
            this.texArray[0] = u1; this.texArray[1] = v1;
            this.texArray[2] = u2; this.texArray[3] = v1;
            this.texArray[4] = u1; this.texArray[5] = v2;
            this.texArray[6] = u1; this.texArray[7] = v2;
            this.texArray[8] = u2; this.texArray[9] = v1;
            this.texArray[10] = u2; this.texArray[11] = v2;
        } else {
            for (let i = 0; i < 12; i++) this.texArray[i] = texcoord_[i];
        }

        if (flip[0]){
            for(let i=0; i<this.texArray.length; i+=2){
                this.texArray[i] = 1 - this.texArray[i]
            }
        }
        if (flip[1]){
            for(let i=0; i<this.texArray.length; i+=2){
                this.texArray[i+1] = 1 - this.texArray[i+1]
            }
        }


        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.texArray, 0, 12);

        gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);

        this._applyFillColorUniform(fillColor_);
        gl.uniform1f(this.alphaLocation, targetAlpha);

        gl.bindTexture(gl.TEXTURE_2D, imgObj.texture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // fillColor_ 값을 u_color 유니폼에 반영한다. 0~1 범위가 아니면(0~255로 준 경우)
    // 정규화한다. drawImage와 텍스트 배치 렌더링(_drawGlyphBatch)이 공유해서 쓴다.
    _applyFillColorUniform(fillColor_) {
        const gl = this.gl;
        if (fillColor_ == null) {
            gl.uniform4f(this.colorLocation, 1.0, 1.0, 1.0, 1.0);
            return;
        }

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
    }

    clear(r = 0, g = 0, b = 0, a = 1) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resizeCanvas() {
        this.dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(this.gl.canvas.clientWidth * this.dpr);
        const displayHeight = Math.floor(this.gl.canvas.clientHeight * this.dpr);
        if (this.gl.canvas.width !== displayWidth || this.gl.canvas.height !== displayHeight) {
            this.gl.canvas.width = displayWidth;
            this.gl.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
            return true;
        }
        return false;
    }

    // 새 아틀라스 페이지(캔버스 1장 + 텍스처 1장 + 자체 커서)를 생성해 등록한다.
    _addAtlasPage() {
        const gl = this.gl;

        const canvas = document.createElement('canvas');
        canvas.width = this.atlasSize;
        canvas.height = this.atlasSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.atlasSize, this.atlasSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const page = {
            canvas,
            ctx,
            texture,
            cursorX: 0,
            cursorY: 0,
            maxRowHeight: 0
        };

        this.atlasPages.push(page);
        return page;
    }

    // 모든 페이지와 glyph 캐시를 비우고 1페이지 상태로 되돌린다.
    // 페이지 상한(maxAtlasPages)에 도달했을 때만 호출되는 최후의 보루다.
    _resetAllAtlasPages() {
        const gl = this.gl;
        for (const page of this.atlasPages) {
            gl.deleteTexture(page.texture);
        }
        this.atlasPages.length = 0;
        this.glyphCache.clear();
        this._addAtlasPage();
    }

    _cacheGlyph(char, fontStr, sizeNum) {
        const key = `${char}_${fontStr}`;
        if (this.glyphCache.has(key)) {
            return this.glyphCache.get(key);
        }

        let page = this.atlasPages[this.atlasPages.length - 1];
        page.ctx.font = fontStr;
        page.ctx.fillStyle = 'white';
        page.ctx.textBaseline = 'top';

        const metrics = page.ctx.measureText(char);
        const w = Math.max(1, Math.ceil(metrics.width));
        const h = Math.ceil(sizeNum * 1.4);

        if (page.cursorX + w > this.atlasSize) {
            page.cursorX = 0;
            page.cursorY += page.maxRowHeight + 2;
            page.maxRowHeight = 0;
        }

        // 현재 페이지가 꽉 찼으면 리셋하지 않고 새 페이지를 추가해 기존 glyph를 보존한다.
        // (기존: 공간 부족 시 아틀라스 전체를 리셋 → 이미 그려둔 글자까지 매번 다시 그려야 했음)
        if (page.cursorY + h > this.atlasSize) {
            if (this.atlasPages.length >= this.maxAtlasPages) {
                console.warn(`Font Atlas 페이지 상한(${this.maxAtlasPages})에 도달해 전체를 리셋합니다.`);
                this._resetAllAtlasPages();
            } else {
                console.info(`Font Atlas 페이지 ${this.atlasPages.length + 1}번째를 추가합니다.`);
                page = this._addAtlasPage();
            }
            // 새/리셋된 페이지에서 다시 시도. 1회 재귀로 항상 공간이 확보된다.
            return this._cacheGlyph(char, fontStr, sizeNum);
        }

        page.ctx.clearRect(page.cursorX, page.cursorY, w, h);
        page.ctx.fillText(char, page.cursorX, page.cursorY);

        // 변경된 글자 영역만 추출하여 부분 업데이트 (성능 문제 해결 핵심 부분)
        const imgData = page.ctx.getImageData(page.cursorX, page.cursorY, w, h);

        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, page.texture);
        // 셰이더/blendFunc가 프리멀티플라이드 알파를 가정하므로 업로드 시에도
        // 프리멀티플라이를 켜서 loadImage 텍스처와 동일한 규격을 맞춘다.
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            page.cursorX,
            page.cursorY,
            w,
            h,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            imgData
        );

        const pageIndex = this.atlasPages.indexOf(page);
        const glyphInfo = {
            pageIndex,
            width: w,
            height: h,
            u1: page.cursorX / this.atlasSize,
            v1: page.cursorY / this.atlasSize,
            u2: (page.cursorX + w) / this.atlasSize,
            v2: (page.cursorY + h) / this.atlasSize,
            // 공백처럼 실제로 그릴 픽셀이 없는 glyph는 드로우콜 자체를 생략하기 위한 플래그
            isBlank: metrics.width === 0
        };

        this.glyphCache.set(key, glyphInfo);

        page.cursorX += w + 2;
        page.maxRowHeight = Math.max(page.maxRowHeight, h);

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

        // 글자를 하나씩 drawImage로 그리면 글자 수만큼 draw call이 발생해
        // 텍스트가 많아질수록(=아틀라스 페이지가 늘어날수록) 급격히 느려진다.
        // 대신 같은 아틀라스 페이지를 쓰는 glyph들을 모아 페이지당 draw call
        // 1번(필요 시 maxBatchQuads 단위로 분할)으로 처리한다.
        const quadsByPage = new Map(); // pageIndex → [{x,y,w,h,u1,v1,u2,v2}, ...]
        let currentX = startX;
        const currentY = pos[1];

        for (const glyph of glyphsToDraw) {
            // 공백 등 실제 픽셀이 없는 glyph는 커서만 이동하고 건너뛴다.
            if (!glyph.isBlank) {
                let quads = quadsByPage.get(glyph.pageIndex);
                if (!quads) {
                    quads = [];
                    quadsByPage.set(glyph.pageIndex, quads);
                }
                quads.push({
                    x: currentX, y: currentY,
                    w: glyph.width, h: glyph.height,
                    u1: glyph.u1, v1: glyph.v1, u2: glyph.u2, v2: glyph.v2
                });
            }
            currentX += glyph.width;
        }

        for (const [pageIndex, quads] of quadsByPage) {
            this._drawGlyphBatch(pageIndex, quads, colorRGB);
        }
    }

    // 한 아틀라스 페이지에 속한 quad들을 한 번(또는 maxBatchQuads 단위로 나눠)의
    // draw call로 그린다. text()에서 페이지별로 모은 glyph 사각형들을 넘겨받는다.
    _drawGlyphBatch(pageIndex, quads, colorRGB) {
        const gl = this.gl;
        const page = this.atlasPages[pageIndex];

        gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);
        this._applyFillColorUniform(colorRGB);
        gl.uniform1f(this.alphaLocation, 1.0);

        gl.bindTexture(gl.TEXTURE_2D, page.texture);

        let offset = 0;
        while (offset < quads.length) {
            const count = Math.min(this.maxBatchQuads, quads.length - offset);

            for (let i = 0; i < count; i++) {
                const q = quads[offset + i];
                const base = i * 12;
                const x2 = q.x + q.w;
                const y2 = q.y + q.h;

                this.posArray[base]     = q.x;  this.posArray[base + 1]  = q.y;
                this.posArray[base + 2] = x2;   this.posArray[base + 3]  = q.y;
                this.posArray[base + 4] = q.x;  this.posArray[base + 5]  = y2;
                this.posArray[base + 6] = q.x;  this.posArray[base + 7]  = y2;
                this.posArray[base + 8] = x2;   this.posArray[base + 9]  = q.y;
                this.posArray[base + 10] = x2;  this.posArray[base + 11] = y2;

                this.texArray[base]     = q.u1; this.texArray[base + 1]  = q.v1;
                this.texArray[base + 2] = q.u2; this.texArray[base + 3]  = q.v1;
                this.texArray[base + 4] = q.u1; this.texArray[base + 5]  = q.v2;
                this.texArray[base + 6] = q.u1; this.texArray[base + 7]  = q.v2;
                this.texArray[base + 8] = q.u2; this.texArray[base + 9]  = q.v1;
                this.texArray[base + 10] = q.u2; this.texArray[base + 11] = q.v2;
            }

            const floatCount = count * 12;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.posArray, 0, floatCount);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.texArray, 0, floatCount);

            gl.drawArrays(gl.TRIANGLES, 0, count * 6);

            offset += count;
        }
    }

    _parseColor(colorStr) {
        if (Array.isArray(colorStr)) {
            return colorStr;
        }

        if (this.colorCache.has(colorStr)) {
            return this.colorCache.get(colorStr);
        }

        if (!this._colorCtx) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            this._colorCtx = canvas.getContext('2d', { willReadFrequently: true });
        }

        this._colorCtx.clearRect(0, 0, 1, 1);
        this._colorCtx.fillStyle = colorStr;
        this._colorCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = this._colorCtx.getImageData(0, 0, 1, 1).data;

        const parsed = [r / 255, g / 255, b / 255, a / 255];
        this.colorCache.set(colorStr, parsed);
        return parsed;
    }

    // 리소스 정리. 이 인스턴스를 더 이상 사용하지 않을 때 호출해 GPU 메모리와
    // ResizeObserver를 해제한다. (기존: 정리 수단이 전혀 없어 SPA 등에서 재생성 시 누수)
    dispose() {
        const gl = this.gl;
        this._resizeObserver.disconnect();
        for (const imgObj of this.images) {
            gl.deleteTexture(imgObj.texture);
        }
        this.images.length = 0;
        // 비디오는 disposeVideo()가 하는 정리(rVFC/rAF 취소, video.load() 등)를
        // 그대로 재사용해 dispose() 전체 호출 시에도 동일하게 안전하게 정리한다.
        for (const videoObj of [...this.videos]) {
            this.disposeVideo(videoObj);
        }
        for (const page of this.atlasPages) {
            gl.deleteTexture(page.texture);
        }
        this.atlasPages.length = 0;
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.texcoordBuffer);
        gl.deleteProgram(this.program);
        this.glyphCache.clear();
        this.colorCache.clear();
    }
}

let cachedRootFontSize = null;

function convertToPx(sizeStr, baseFontSize = 16) {
    const match = String(sizeStr).match(/^([0-9.]+)\s*([a-z%]*)$/i);
    if (!match) return 20;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'px').toLowerCase();

    switch (unit) {
        case 'rem':
            if (!cachedRootFontSize) {
                cachedRootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            }
            return value * cachedRootFontSize;

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

// 비디오 프레임 → WebGL 텍스처 업데이트.
// gl, texture, video 세 값만으로 동작하는 순수 함수 형태로 두어, core 클래스
// 없이도(다른 렌더러에서도) 재사용할 수 있게 했다.
//
// 핵심 최적화:
//   - readyState가 HAVE_CURRENT_DATA 미만이면(아직 디코딩된 프레임이 없음)
//     아무 것도 하지 않고 false를 반환한다 - 준비 안 된 상태에서의 텍스처
//     업데이트 시도로 인한 예외/깨진 텍스처를 방지한다.
//   - video.currentTime을 텍스처별로(WeakMap 사용) 기록해두고, 지난번과
//     같은 시간이면(=일시정지 중이거나 새 프레임이 아직 안 왔음) 업로드를
//     건너뛴다. requestVideoFrameCallback을 못 쓰는 폴백 경로(rAF)에서도
//     이 체크 덕분에 같은 프레임을 중복 업로드하지 않는다.
//   - 최초 1회는 texImage2D로 텍스처 저장공간을 할당하고, 이후에는 같은
//     크기이므로 texSubImage2D로 갱신한다(저장공간 재할당 비용 회피).
const _videoFrameState = new WeakMap(); // texture → { lastTime, initialized }

export function updateVideoTexture(gl, texture, video) {
    if (!gl || !texture || !video) return false;

    // 아직 재생 가능한 프레임이 하나도 디코딩되지 않은 상태
    // (HAVE_NOTHING / HAVE_METADATA) - 이 시점에 texImage2D를 호출하면
    // 브라우저에 따라 크기가 0인 이미지가 올라가거나 예외가 발생할 수 있다.
    if (video.readyState < video.HAVE_CURRENT_DATA) {
        return false;
    }

    const state = _videoFrameState.get(texture) || { lastTime: -1, initialized: false };

    // 일시정지/정지 상태거나 currentTime이 지난 갱신 때와 동일하다면
    // 화면에 표시될 프레임이 바뀌지 않은 것이므로 업로드를 건너뛴다.
    if (state.initialized && video.currentTime === state.lastTime) {
        return false;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    if (!state.initialized) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        state.initialized = true;
    } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    state.lastTime = video.currentTime;
    _videoFrameState.set(texture, state);
    return true;
}