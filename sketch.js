let shapes = [];
let currentShape = 'rectangle';
//let animationType = 'none';
let selectedColor;
let startX, startY;

let editor;
let lastHighlightedLine = null;
let rotationAngle = 0;

function setup() {
    let canvas = createCanvas(400, 400);
    canvas.parent('canvas-container');
    canvas.style('border', '2px dashed black');

    let shapeSelect = select('#shapeSelect');
    shapeSelect.option('rectangle');
    shapeSelect.option('circle');
    shapeSelect.option('line');
    shapeSelect.option('triangle');
    shapeSelect.changed(() => currentShape = shapeSelect.value());

    //let animationSelect = select('#animationSelect');
    //animationSelect.option('none');
    //animationSelect.option('spinning');
    //animationSelect.option('bouncing');
    //animationSelect.option('scaling');
    //animationSelect.option('changingColor');
    //animationSelect.changed(() => animationType = animationSelect.value());

    let colorPicker = createColorPicker('#ff0000');
    colorPicker.parent('tools');
    colorPicker.style('margin-left', '10px');
    colorPicker.input(() => selectedColor = colorPicker.color());

    selectedColor = colorPicker.color(); // Set initial color

    // CodeMirror setup
    editor = CodeMirror(document.getElementById('editor'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'default',
        readOnly: false
    });
    //editor.setSize(windowWidth / 2, windowHeight * 0.90);
    editor.setOption('theme', 'default');
    editor.getWrapperElement().style.border = '2px dashed black';
    updateEditor(null); // Initial code display

    // Add event listener to the button
    /*document.getElementById('runCodeButton').addEventListener('click', () => {
        try {
            let code = editor.getValue();
            console.log(code);
            eval(code);
            editor.getAllMarks().forEach(mark => mark.clear());
        } catch (error) {
            let errorLine = error.lineNumber - 1;
            editor.markText({ line: errorLine, ch: 0 }, { line: errorLine, ch: Infinity }, { className: 'syntax-error' });
        }
    });*/
}

function draw() {
    background(255);
    //rotationAngle += 0.02;
    for (let shape of shapes) {
        shape.update();
        shape.display();
    }
    drawPreview();
}

function drawPreview() {
    if (mouseIsPressed) {
        let width = mouseX - startX;
        let height = mouseY - startY;

        if (abs(width) > 3 && abs(height) > 3) {
            noFill();
            stroke(0);
            switch (currentShape) {
                case 'rectangle':
                    rect(startX, startY, width, height);
                    break;
                case 'circle':
                    let diameter = max(abs(width), abs(height));
                    ellipse(startX, startY, diameter, diameter);
                    break;
                case 'line':
                    line(startX, startY, mouseX, mouseY);
                    break;
                case 'triangle':
                    let x3 = startX + (mouseX - startX) * 0.5;
                    let y3 = startY - abs(mouseY - startY);
                    triangle(startX, startY, mouseX, mouseY, x3, y3);
                    break;
            }
        }
    }
}

function mousePressed() {
    startX = mouseX;
    startY = mouseY;
}

function mouseReleased() {
    // Check if the mouse is within the canvas and the width and height are each greater than 3px
    if (mouseX < 0 || mouseX > 400 || mouseY < 0 || mouseY > 400) {
        return;
    }

    let width = mouseX - startX;
    let height = mouseY - startY;

    if (abs(width) <= 3 || abs(height) <= 3) {
        return;
    }

    let newShape = null;

    let animationType = 'none';

    switch (currentShape) {
        case 'rectangle':
            newShape = new Rectangle(startX, startY, width, height, animationType, selectedColor);
            break;
        case 'circle':
            let diameter = max(abs(width), abs(height));
            newShape = new Circle(startX, startY, diameter, animationType, selectedColor);
            break;
        case 'line':
            newShape = new Line(startX, startY, mouseX, mouseY, animationType, selectedColor);
            break;
        case 'triangle':
            newShape = new Triangle(startX, startY, mouseX, mouseY, animationType, selectedColor);
            break;
    }

    if (newShape) {
        shapes.push(newShape);
        updateEditor(newShape); // Update the code in the editor
    }
}

function updateEditor(shape) {
    console.log(shape);
    let code = editor.getValue(); // Get the current code from the editor

    if (shape == null) {
        code = `function setup() {
    createCanvas(400, 400);
}

function draw() {
    background(255);
}`;
        editor.setValue(code);
        return;
    }

    // Append the new shape's code before the closing bracket of the draw function
    let drawFunctionEndIndex = code.lastIndexOf('}');
    code = code.substring(0, drawFunctionEndIndex) + `    ${shape.getCode()}\n}` + code.substring(drawFunctionEndIndex + 1);

    // Clear previous content and add the new code
    editor.setValue(code);

    // Remove the previous highlight
    if (lastHighlightedLine !== null) {
        editor.removeLineClass(lastHighlightedLine, 'background', 'new-code-line');
    }

    // Highlight the new lines in green
    let lines = code.split('\n');
    let newHighlightedLines = shape.getCode().split('\n').length; // Number of lines added by the shape
    let startHighlightLine = lines.length - newHighlightedLines - 1; // Start line of the new shape's code

    for (let i = 0; i < newHighlightedLines; i++) {
        editor.addLineClass(startHighlightLine + i, 'background', 'new-code-line');
    }
    lastHighlightedLine = startHighlightLine + newHighlightedLines - 1;

    // Re-evaluate the updated code to reflect changes on the canvas
    try {
        eval(editor.getValue());
    } catch (error) {
        console.error('Error evaluating code:', error);
    }
}

// CSS for highlighting new lines
let style = document.createElement('style');
style.innerHTML = `
    .CodeMirror .new-code-line {
        background-color: #d4fcb2;
    }
`;
document.head.appendChild(style);

class Shape {
    constructor(x, y, animation, color) {
        this.x = x;
        this.y = y;
        this.animation = animation;
        this.angle = 0;
        this.scale = 1;
        this.color = color;
        this.speedX = random(-2, 2);
        this.speedY = random(-2, 2);
        this.center = createVector(x, y);
    }

    update() {
        if (this.animation === 'spinning') {
            push();
            translate(width / 2, height / 2);
            this.angle = rotationAngle;
            pop();
        } else if (this.animation === 'bouncing') {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > width || this.x < 0){
                console.log(this.x);
                console.log(width);
                this.speedX *= -1;
            }
            if (this.y > height || this.y < 0) this.speedY *= -1;
        } else if (this.animation === 'scaling') {
            this.scale = sin(frameCount * 0.05) * 0.5 + 1;
        } else if (this.animation === 'changingColor') {
            this.color = color(random(255), random(255), random(255));
        }
    }

    display() {
        // To be overridden by subclasses
    }

    getCode() {
        // To be overridden by subclasses
        return '';
    }

    getAnimationCode() {
        let code = '';
        if (this.animation === 'spinning') {
            code += 'push();\n';
            code += '    translate(width / 2, height / 2);\n';
            code += '    rotate(angle);\n';
            code += '    pop();\n';
            //code += `${this.className}; rotate(${this.angle.toFixed(2)}); `;
        } else if (this.animation === 'bouncing') {
            code += `translate(${this.x.toFixed(0)}, ${this.y.toFixed(0)}); `;
        } else if (this.animation === 'scaling') {
            code += `scale(${this.scale.toFixed(2)}); `;
        } else if (this.animation === 'changingColor') {
            code += `fill(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]}); `;
        }
        return code;
    }
}

class Rectangle extends Shape {
    constructor(x, y, w, h, animation, color) {
        super(x, y, animation, color);
        this.w = w;
        this.h = h;
    }

    display() {
        push();
        if (this.animation === 'spinning') {
            translate(this.x + this.w  / 2,  this.y + this.h / 2);
            //rotate(rotationAngle);
        } else {
            translate(this.x + this.w / 2, this.y + this.h / 2);
        }
        scale(this.scale);
        fill(this.color);
        rectMode(CENTER);
        rect(0, 0, this.w, this.h);
        pop();
    }

    getCode() {
        /*if (this.animation === 'spinning') {
            return `push();
    translate(${this.x + this.w / 2}, ${this.y + this.h / 2});
    rotate(rotationAngle += 0.02);
    scale(${this.scale});
    fill(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]});
    rectMode(CENTER);
    rect(0, 0, ${this.w}, ${this.h});
    pop();`;
        }
        if (this.animation === 'bouncing') {
            return ` translate(${this.x + this.w / 2}, ${this.y + this.h / 2});
    scale(${this.scale});
    fill(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]});
    rectMode(CENTER);
    rect(0, 0, positionX, ${this.h});
    `;
        }*/
        return `push();
    translate(${this.x + this.w / 2}, ${this.y + this.h / 2})
    fill(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]});
    rectMode(CENTER);
    rect(0, 0, ${this.w}, ${this.h});
    pop();`;
    }

    update() {
        if (this.animation === 'bouncing') {
            if (this.w + this.x > width) this.speedX *= -1;
            if (this.h + this.y > height) this.speedY *= -1;    
        }
        super.update();
    }
}

class Line extends Shape {
    constructor(x1, y1, x2, y2, animation, color) {
        super(x1, y1, animation, color);
        this.x2 = x2;
        this.y2 = y2;
    }

    display() {
        push();
        stroke(this.color);
        strokeWeight(2);
        line(this.x, this.y, this.x2, this.y2);
        pop();
    }

    getCode() {
        return `push();
    stroke(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]});
    strokeWeight(2);
    line(${this.x}, ${this.y}, ${this.x2}, ${this.y2});
    pop();`;
    }

    update() {
        console.log(this.animation);
        if (this.animation === 'bouncing') {
            console.log(`x2: ${this.x2}, width: ${width}`);
            if (this.x2 > width) {
                console.log('Bouncing condition met');
                this.speedX *= -1;
            }
        }
        super.update();
    }
}

class Circle extends Shape {
    constructor(x, y, d, animation, color) {
        super(x, y, animation, color);
        this.d = d;
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        scale(this.scale);
        fill(this.color);
        ellipse(0, 0, this.d, this.d);
        pop();
    }

    getCode() {
        return `push();
    translate(${this.x}, ${this.y});
    rotate(${this.angle});
    scale(${this.scale});
    fill(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]});
    ellipse(0, 0, ${this.d}, ${this.d});
    pop();`;
    }

    update() {
        super.update();
        if (this.animation === 'bouncing') {
            if (this.x + this.d / 2 > windowWidth || this.x - this.d / 2 < 0) this.speedX *= -1;
            if (this.y + this.d / 2 > height || this.y - this.d / 2 < 0) this.speedY *= -1;
        }
    }
}

class Triangle extends Shape {
    constructor(x1, y1, x2, y2, animation, color) {
        super((x1 + x2) / 2, (y1 + y2) / 2, animation, color);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x1 + (x2 - x1) * 0.5;
        this.y3 = y1 - abs(y2 - y1);
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        scale(this.scale);
        fill(this.color);
        triangle(this.x1 - this.x, this.y1 - this.y, this.x2 - this.x, this.y2 - this.y, this.x3 - this.x, this.y3 - this.y);
        pop();
    }

    getCode() {
        return `push();
    translate(${this.x}, ${this.y});
    rotate(${this.angle});
    scale(${this.scale});
    fill(${this.color.levels[0]}, ${this.color.levels[1]}, ${this.color.levels[2]});
    triangle(${this.x1 - this.x}, ${this.y1 - this.y}, ${this.x2 - this.x}, ${this.y2 - this.y}, ${this.x3 - this.x}, ${this.y3 - this.y});
    pop();`;
    }

    update() {
        super.update();
        if (this.animation === 'bouncing') {
            if (this.x1 > width || this.x1 < 0 || this.x2 > width || this.x2 < 0 || this.x3 > width || this.x3 < 0) this.speedX *= -1;
            if (this.y1 > height || this.y1 < 0 || this.y2 > height || this.y2 < 0 || this.y3 > height || this.y3 < 0) this.speedY *= -1;
        }
    }
}
