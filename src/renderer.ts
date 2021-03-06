// π Position Vertex Buffer Data
const positions = new Float32Array([
    1.0, -1.0, 0.0,
   -1.0, -1.0, 0.0,
    0.0, 1.0, 0.0
]);

// π¨ Color Vertex Buffer Data
const colors = new Float32Array([
    1.0, 0.0, 0.0, // π΄
    0.0, 1.0, 0.0, // π’
    0.0, 0.0, 1.0  // π΅
]);

// ποΈ Index Buffer Data
const indices = new Uint16Array([ 0, 1, 2 ]);


// πΈοΈ Vertex Shader Source
const vertShaderCode = `
attribute vec3 inPosition;
attribute vec3 inColor;

varying vec3 vColor;

void main()
{
    vColor = inColor;
    gl_Position = vec4(inPosition, 1.0);
}
`;

// π¦ Fragment Shader Source
const fragShaderCode = `
precision mediump float;

varying highp vec3 vColor;

void main()
{
    gl_FragColor = vec4(vColor, 1.0);
}
`;

/*************************************************************/

export default class Renderer {
    // πΌοΈ Canvas
    canvas: HTMLCanvasElement;

    // βοΈ API Data Structures
    gl: WebGLRenderingContext;

    // ποΈ Frame Backings
    animationHandler: number;

    // πΊ Resources
    positionBuffer: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    vertModule: WebGLShader;
    fragModule: WebGLShader;
    program: WebGLProgram;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    // ποΈ Start the Rendering Engine
    start() {
        this.initializeAPI();
        this.initializeResources();
        this.render();
    }

    // π Initialize WebGL
    initializeAPI() {
        // βͺ Initialization
        var gl: WebGLRenderingContext = this.canvas.getContext('webgl');
        if (!gl) {
            // This rendering engine failed to start...
            throw new Error('WebGL failed to initialize.');
        }
        this.gl = gl;

        // Most WebGL Apps will want to enable these settings:

        // β« Set the default clear color when calling `gl.clear`
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        // π­ Write to all channels during a clear
        gl.colorMask(true, true, true, true);
        // π Test if when something is drawn, it's in front of what was drawn previously
        gl.enable(gl.DEPTH_TEST);
        // β€ Use this function to test depth values
        gl.depthFunc(gl.LEQUAL);
        // π Hide triangles who's normals don't face the camera
        gl.cullFace(gl.BACK);
        // π₯ Properly blend images with alpha channels
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    // π± Initialize resources to render triangle (buffers, shaders, pipeline)
    initializeResources() {
        let gl = this.gl;

        // π Helper function for creating WebGLBuffer(s) out of Typed Arrays
        let createBuffer = (arr) => {
            // βͺ Create Buffer
            let buf = gl.createBuffer();
            let bufType =
                arr instanceof Uint16Array || arr instanceof Uint32Array ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
            // π©Ή Bind Buffer to WebGLState
            gl.bindBuffer(bufType, buf);
            // πΎ Push data to VBO
            gl.bufferData(bufType, arr, gl.STATIC_DRAW);
            return buf;
        };

        this.positionBuffer = createBuffer(positions);
        this.colorBuffer = createBuffer(colors);
        this.indexBuffer = createBuffer(indices);

        // π Helper function for creating WebGLShader(s) out of strings
        let createShader = (source: string, stage) => {
            // βͺ Create Shader
            let s = gl.createShader(stage);
            // π° Pass Vertex Shader String
            gl.shaderSource(s, source);
            // π¨ Compile Vertex Shader (and check for errors)
            gl.compileShader(s);
            // β Check if shader compiled correctly
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error('An error occurred compiling the shader: ' + gl.getShaderInfoLog(s));
            }
            return s;
        };

        this.vertModule = createShader(vertShaderCode, gl.VERTEX_SHADER);
        this.fragModule = createShader(fragShaderCode, gl.FRAGMENT_SHADER);

        // π Helper function for creating WebGLProgram(s) out of WebGLShader(s)
        let createProgram = (stages: WebGLShader[]) => {
            let p = gl.createProgram();
            for (let stage of stages) {
                gl.attachShader(p, stage);
            }
            gl.linkProgram(p);
            return p;
        };

        this.program = createProgram([ this.vertModule, this.fragModule ]);
    }

    // πΊ Render triangle
    render = () => {
        var gl = this.gl;

        // ποΈ Encode drawing commands
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.scissor(0, 0, this.canvas.width, this.canvas.height);

        // π£ Bind Vertex Layout
        let setVertexBuffer = (buf: WebGLBuffer, name: string) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            let loc = gl.getAttribLocation(this.program, name);
            gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 4 * 3, 0);
            gl.enableVertexAttribArray(loc);
        };

        setVertexBuffer(this.positionBuffer, 'inPosition');
        setVertexBuffer(this.colorBuffer, 'inColor');

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

        // βΏ Refresh canvas
        this.animationHandler = requestAnimationFrame(this.render);
    };

    // π₯ Destroy Buffers, Shaders, Programs
    destroyResources() {
        var gl = this.gl;

        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.colorBuffer);
        gl.deleteBuffer(this.indexBuffer);
        gl.deleteShader(this.vertModule);
        gl.deleteShader(this.fragModule);
        gl.deleteProgram(this.program);
    }

    // π Stop the renderer from refreshing, destroy resources
    stop() {
        cancelAnimationFrame(this.animationHandler);
        this.destroyResources();
    }
}
