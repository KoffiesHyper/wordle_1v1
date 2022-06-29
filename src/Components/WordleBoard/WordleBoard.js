import './WordleBoard.css';
import Row from '../Row/Row';

export default function WordleBoard({ attempts, colors, shakeRow }) {
    return (
        <div className='wordle-board'>
            {attempts.map((e, i) => {
                return <Row attempt={e} key={i} colors={colors[i]} shakeRow={i === shakeRow} />
            })
            }
        </div>
    )
}