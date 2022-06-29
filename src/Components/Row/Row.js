import './Row.css';
import Cell from "../Cell/Cell";

export default function Row({ attempt, colors, shakeRow }) {

    const arr = Array(5);
    for(let i = 0; i < arr.length; i++) arr[i] = 0;

    return (
        <div className='row' style={{animationName: (shakeRow) ? 'Shake' : ''}}>
            {
                arr.map((e, i) => {
                    return <Cell color={colors[i]} letter={(attempt[i] ? attempt[i]: '')} key={i} />
                })
            }
        </div>
    )
}