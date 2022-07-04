import './WordleBoard.css';
import Row from '../Row/Row';

export default function WordleBoard({ attempts, colors, shakeRow, tag }) {

    const isPlayer = localStorage.getItem('tag') === tag;

    return (
        // <div className='wordle-board' style={{animationName: (isPlayer) ? 'shiftLeft' : 'shiftRight'}}>
        <div className='wordle-board'>
            <h3 style={{color: (isPlayer) ? 'rgb(125, 247, 125)' : 'white'}}>{tag}</h3>
            {attempts.map((e, i) => {
                return <Row attempt={e} key={i} colors={colors[i]} shakeRow={i === shakeRow} />
            })
            }
        </div>
    )
}