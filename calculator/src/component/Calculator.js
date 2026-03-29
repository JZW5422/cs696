import React, { useState } from 'react';
function Calculator() {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    return (
        <div id="calculator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input name="num1" type="number" placeholder='Type Number' onChange={(e) => setNum1(Number(e.target.value))} />
            <p style={{ margin: 0 }}>+</p>
            <input name="num2" type="number" placeholder='Type Number' onChange={(e) => setNum2(Number(e.target.value))} />
            <p style={{ margin: 0 }}>=</p>
            <p style={{ margin: 0 }}>{num1 + num2}</p>
        </div>
    );
}

export default Calculator;