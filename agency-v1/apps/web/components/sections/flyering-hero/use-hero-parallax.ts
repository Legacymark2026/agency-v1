import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent } from "react";

export function useHeroParallax() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

    // Add more transform layers as needed, or let consumers define them
    const layer1X = useTransform(springX, [-0.5, 0.5], [-20, 20]);
    const layer1Y = useTransform(springY, [-0.5, 0.5], [-20, 20]);

    const layer2X = useTransform(springX, [-0.5, 0.5], [-40, 40]);
    const layer2Y = useTransform(springY, [-0.5, 0.5], [-40, 40]);

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
        const { width, height } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX / width - 0.5;
        const y = e.clientY / height - 0.5;

        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);

        springX.set(x);
        springY.set(y);
    }

    return {
        mouseX,
        mouseY,
        rotateX,
        rotateY,
        layer1X,
        layer1Y,
        layer2X,
        layer2Y,
        handleMouseMove
    };
}
