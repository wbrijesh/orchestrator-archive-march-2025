const Spacer = ({
    direction = 'horizontal',
    size = 0    
}) => {
    return (
        <div style={{
            [direction === 'horizontal' ? 'width' : 'height']: `${size}px`
        }} />
    )
}

export default Spacer