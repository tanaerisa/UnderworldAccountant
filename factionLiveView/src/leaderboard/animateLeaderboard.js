import React, { useState, useLayoutEffect, useEffect } from "react"
import usePrevious from "./hooks/usePrevious"
import calculateBoundingBoxes from "./helpers/calculateBoundingBoxes";

const AnimateLeaderboard = ({ children }) => {
    const [boundingBox, setBoundingBox] = useState({});
    const [prevBoundingBox, setPrevBoundingBox] = useState({});
    const prevChildren = usePrevious(children);

    useLayoutEffect(() => {
        const newBoundingBox = calculateBoundingBoxes(children);
        setBoundingBox(newBoundingBox);
    }, [children]);

    useLayoutEffect(() => {
        const prevBoundingBox = calculateBoundingBoxes(prevChildren);
        setPrevBoundingBox(prevBoundingBox);
    }, [prevChildren]);

    useEffect(() => {
        const hasPrevBoundingBox = Object.keys(prevBoundingBox).length;

        if (hasPrevBoundingBox) {
            React.Children.forEach(children, child => {
                const domNode = child.ref.current;
                const firstBox = prevBoundingBox[child.key];
                const lastBox = boundingBox[child.key];
                const changeInX = firstBox.left - lastBox.left;
                const changeInY = firstBox.top - lastBox.top;
                //console.log(`X: ${changeInX}, Y: ${changeInY}`)

                if (changeInX || changeInY) {
                    requestAnimationFrame(() => {
                        // Before theh DOM paints, invert child to old position
                        domNode.style.transform = `translate(${changeInX}px, ${changeInY}px)`;
                        domNode.style.transition = "transform 0s";

                        requestAnimationFrame(() => {
                            // After previous frame, remove transition to play animation
                            domNode.style.transform = "";
                            domNode.style.transition = "transform 500ms";
                        });
                    });
                }
            });
        }
    }, [boundingBox, prevBoundingBox, children]);

    return children;
};

export default AnimateLeaderboard;