import './Cell.css';

export default function Cell({ letter, color }) {

    let bg;
    let fc = 'white';

    switch (color) {
        case 'g':
            bg = 'rgb(125, 247, 125)';
            fc = 'black'
            break;
        case 'y':
            bg = 'rgb(255, 255, 0)';
            fc = 'black'
            break;
        case 'd':
            bg = 'rgb(100, 100, 100)';
            fc = 'white'
            break;
    }

    return (
        <div className='cell' style={{ backgroundColor: bg }}>
            <p style={{color: fc}}>{letter}</p>
        </div>
    )
}