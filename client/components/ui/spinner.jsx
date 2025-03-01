import { useState, useEffect } from 'react';

const Spinner = ({ color = "black", className = "size-10" }) => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => (prev + 1) % 8);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const getOpacity = (index) => {
        const opacities = [30, 40, 50, 60, 70, 80, 90, 100];
        return opacities[(index + rotation) % 8] / 100;
    };

    return (
        <svg className={className} viewBox="0 0 256 256">
            <line x1="128" y1="32" x2="128" y2="64" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(0)}}></line>
            <line x1="195.9" y1="60.1" x2="173.3" y2="82.7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(1)}}></line>
            <line x1="224" y1="128" x2="192" y2="128" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(2)}}></line>
            <line x1="195.9" y1="195.9" x2="173.3" y2="173.3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(3)}}></line>
            <line x1="128" y1="224" x2="128" y2="192" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(4)}}></line>
            <line x1="60.1" y1="195.9" x2="82.7" y2="173.3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(5)}}></line>
            <line x1="32" y1="128" x2="64" y2="128" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(6)}}></line>
            <line x1="60.1" y1="60.1" x2="82.7" y2="82.7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" style={{stroke: color, opacity: getOpacity(7)}}></line>
        </svg>
    );
};

export default Spinner;
