

const ctx = document.getElementById("canvas").getContext("2d");

const outerRing = {
    radius: 250,
    color: "black",
    draw() {
        ctx.beginPath();
        const ring = new Path2D();
        ring.arc(outerRing.radius, outerRing.radius, outerRing.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.strokeStyle = 'black';
        ctx.stroke(ring);
    }
}

const innerRing = {
    theta: 0,
    radius: 200 * 2,
    x: 0,
    y: 0,
    startTime: 0,

    draw() {
        this.x = outerRing.radius + (outerRing.radius - this.radius) * Math.cos(this.theta);
        this.y = outerRing.radius + (outerRing.radius - this.radius) * Math.sin(this.theta);

        ctx.beginPath();
        const ring = new Path2D();
        ring.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.strokeStyle = "grey";
        ctx.stroke(ring);
    }
}

class Path {
    constructor(radius, theta_offset, color, active) {
        this.radius = radius;
        this.theta_offset = theta_offset;
        this.color = color;
        this.active = active;
        this.finished = false;
        this.points = new Array();
        this.point = {};
    }
    update(savePoint = true) {
        var theta = this.theta_offset - innerRing.theta * (outerRing.radius / innerRing.radius);
        var x = innerRing.x + this.radius * Math.cos(theta);
        var y = innerRing.y + this.radius * Math.sin(theta);
        var tmpPoint = { x: x, y: y };
        if (savePoint && (this.points.length > 10) && (distance(tmpPoint, this.points[0]) <= 1)) {
            this.points.push(tmpPoint);
            this.finished = true;
        }
        if (!this.finished) {
            this.points.push(tmpPoint);
        }

        this.point = { x: tmpPoint.x, y: tmpPoint.y }
        this.draw();
    }

    drawPen() {
        const pen = new Path2D();
        pen.arc(this.point.x, this.point.y, 2, 0, Math.PI * 2, true);
        ctx.fillStyle = this.color;
        ctx.fill(pen);
    }

    drawPath() {
        if (this.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            this.points.slice(1).forEach(function (point) { ctx.lineTo(point.x, point.y); });
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }
    draw() {
        if (!this.finished) {
            this.drawPen();
        }
        this.drawPath();
    }
}

const paths = [new Path(0.5 * outerRing.radius, 0, 'red', true),
new Path(0.75 * outerRing.radius, 0, 'blue', false),
new Path(0.25 * outerRing.radius, 0, 'green', false),
];



function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function setup_draw() {
    ctx.clearRect(0, 0, 2 * outerRing.radius, 2 * outerRing.radius);
    outerRing.draw();
    innerRing.draw();
    paths.forEach(function (path) {
        if (path.active) { path.update(false); path.drawPen(); }
    })
}

let animationFrame;

function animate() {
    ctx.clearRect(0, 0, 2 * outerRing.radius, 2 * outerRing.radius);
    ctx.fillStyle = "rgb(0,0,0/40%)";
    ctx.strokeStyle = "rgb(200,0,0/40%)";
    outerRing.draw();
    const time = new Date();
    const timeDiff = new Date(time - innerRing.startTime);
    innerRing.theta = (2 * Math.PI) *
        (10 * timeDiff.getMinutes()
            + timeDiff.getSeconds() / 6
            + timeDiff.getMilliseconds() / 6000);

    innerRing.draw();
    paths.forEach(function (path) { if (path.active) { path.update(); } })
    if (paths.every(function (path) { return !path.active || path.finished })) {
        ctx.clearRect(0, 0, 3 * outerRing.radius, 3 * outerRing.radius);
        paths.forEach(function (path) { path.drawPath(); })
    } else {
        animationFrame = window.requestAnimationFrame(animate);
    }
}

function init_canvas() {
    const canvas_parent = $("#canvas_parent");
    const parent_width = canvas_parent.width();
    const canvas = $("#canvas");
    canvas.width(parent_width);
    canvas.height(parent_width);
    canvas.prop('width', parent_width).prop('height', parent_width);

    outerRing.radius = 0.5 * parent_width;
    innerRing.radius = 0.5 * outerRing.radius;
    paths[0].radius = 0.5 * innerRing.radius;
    paths[1].radius = 0.75 * innerRing.radius;
    paths[2].radius = 0.25 * innerRing.radius;
    setup_draw();
}

function clear_run() {
    paths.forEach(function (path) {
        path.points = [];
        path.finished = false;
    })
    innerRing.theta = 0;
}

$(document).ready(function () {
    // setup canvas size:
    const ctx = document.getElementById("canvas").getContext("2d");
    const size = init_canvas();

    $("#run").click(function () {
        clear_run();
        innerRing.startTime = new Date();
        animate();
    });

    $(".config").on("change input", function () {
        cancelAnimationFrame(animationFrame);
        clear_run();

        innerRing.theta = 0;
        innerRing.radius = $("#ring_size").val() * outerRing.radius;

        ['red', 'blue', 'green'].forEach(function (pen, i) {
            paths[i].active = $("#" + pen + "_pen_active").is(":checked");
            paths[i].radius = parseFloat($("#" + pen + "_pen_radius").val()) * innerRing.radius;
            paths[i].theta_offset = parseInt($("#" + pen + "_pen_angle").val()) * Math.PI / 180.0;
        });

        setup_draw();
    });
});

