import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'markers',
        'message',
        'photo',
        'position',
        'rotation',
        'scale',
        'stage',
        'status',
        'statusIcon',
        'touchCount',
    ];

    connect() {
        this.transform = { rotation: 0, scale: 1, x: 0, y: 0 };
        this.gesture = null;
        this.activeTouchCount = 0;
        this.applyTransform();

        const supported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.statusTarget.textContent = supported ? 'Touch input available' : 'No touchscreen detected';
        this.messageTarget.textContent = supported
            ? 'Touch and manipulate the image using one or two fingers.'
            : 'Open this page on a touchscreen device to try the gestures.';
        this.statusIconTarget.textContent = supported ? 'hand_draw' : 'xmark_circle';
    }

    update({ detail }) {
        const touches = detail.touches || [];
        this.drawMarkers(touches);
        this.touchCountTarget.textContent = String(touches.length);

        if (touches.length === 0) {
            this.gesture = null;
            this.activeTouchCount = 0;
            this.statusTarget.textContent = 'Gesture complete';
            this.messageTarget.textContent = 'Use another gesture or reset the image.';
            return;
        }

        const gestureTouchCount = Math.min(touches.length, 2);
        if (!this.gesture || gestureTouchCount !== this.activeTouchCount) {
            this.beginGesture(touches, gestureTouchCount);
        }

        if (gestureTouchCount === 1) {
            this.applyDrag(touches[0]);
            this.statusTarget.textContent = 'Dragging image';
            this.messageTarget.textContent = 'Move your finger to reposition the image.';
        } else {
            this.applyTwoFingerGesture(touches[0], touches[1]);
            this.statusTarget.textContent = 'Two-finger gesture active';
            this.messageTarget.textContent = 'Pan, pinch, and rotate at the same time.';
        }
        this.statusIconTarget.textContent = 'hand_draw_fill';
    }

    beginGesture(touches, count) {
        const first = this.point(touches[0]);
        this.activeTouchCount = count;
        this.gesture = {
            rotation: this.transform.rotation,
            scale: this.transform.scale,
            x: this.transform.x,
            y: this.transform.y,
            first,
        };

        if (count === 2) {
            const second = this.point(touches[1]);
            this.gesture.center = this.center(first, second);
            this.gesture.distance = Math.max(this.distance(first, second), 1);
            this.gesture.angle = this.angle(first, second);
        }
    }

    applyDrag(touch) {
        const current = this.point(touch);
        this.transform.x = this.gesture.x + current.x - this.gesture.first.x;
        this.transform.y = this.gesture.y + current.y - this.gesture.first.y;
        this.applyTransform();
    }

    applyTwoFingerGesture(firstTouch, secondTouch) {
        const first = this.point(firstTouch);
        const second = this.point(secondTouch);
        const center = this.center(first, second);
        const scale = this.distance(first, second) / this.gesture.distance;
        const rotation = this.angle(first, second) - this.gesture.angle;

        this.transform.x = this.gesture.x + center.x - this.gesture.center.x;
        this.transform.y = this.gesture.y + center.y - this.gesture.center.y;
        this.transform.scale = this.clamp(this.gesture.scale * scale, 0.5, 3);
        this.transform.rotation = this.normalizeDegrees(this.gesture.rotation + rotation);
        this.applyTransform();
    }

    applyTransform() {
        const { rotation, scale, x, y } = this.transform;
        this.photoTarget.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotate(${rotation}deg)`;
        this.scaleTarget.textContent = `${Math.round(scale * 100)}%`;
        this.rotationTarget.textContent = `${Math.round(rotation)}°`;
        this.positionTarget.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    }

    drawMarkers(touches) {
        const rect = this.stageTarget.getBoundingClientRect();
        this.markersTarget.replaceChildren(...touches.map((touch, index) => {
            const marker = document.createElement('div');
            marker.textContent = String(index + 1);
            marker.style.cssText = [
                'align-items:center',
                'background:rgba(190,32,47,.82)',
                'border:2px solid white',
                'border-radius:50%',
                'color:white',
                'display:flex',
                'font-weight:600',
                'height:44px',
                `left:${touch.clientX - rect.left - 22}px`,
                'justify-content:center',
                'pointer-events:none',
                'position:absolute',
                `top:${touch.clientY - rect.top - 22}px`,
                'width:44px',
                'z-index:2',
            ].join(';');
            return marker;
        }));
    }

    reset() {
        this.transform = { rotation: 0, scale: 1, x: 0, y: 0 };
        this.gesture = null;
        this.activeTouchCount = 0;
        this.applyTransform();
        this.statusTarget.textContent = 'Image reset';
        this.messageTarget.textContent = 'Touch and manipulate the image using one or two fingers.';
        this.statusIconTarget.textContent = 'arrow_counterclockwise';
    }

    point(touch) {
        return { x: touch.clientX, y: touch.clientY };
    }

    center(first, second) {
        return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    }

    distance(first, second) {
        return Math.hypot(second.x - first.x, second.y - first.y);
    }

    angle(first, second) {
        return Math.atan2(second.y - first.y, second.x - first.x) * 180 / Math.PI;
    }

    clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }

    normalizeDegrees(value) {
        return (value % 360 + 360) % 360;
    }
}
