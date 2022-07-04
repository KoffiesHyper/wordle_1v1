import { useEffect, useState, useRef } from "react"
import WordleBoard from "../../Components/WordleBoard/WordleBoard"
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom'
import './Game.css';
import { IconContext } from 'react-icons/lib'
import { BsArrowReturnRight, BsBackspace } from 'react-icons/bs';

let eventAdded = false;

const dictionary_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

let socket;

let keyboardRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
let keyboardRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
let keyboardRow3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

export default function Game() {
    const params = useParams();
    const history = useNavigate()

    const [playerID, setPlayerID] = useState(Math.random(10))
    const [matchID, setMatchID] = useState(params.match_id)

    const [attempts, setAttempts] = useState(Array(6).fill(''));
    const [colors, setColors] = useState(Array(6).fill('wwwww'));
    const [word, setWord] = useState('');
    const [currentAttempt, setCurrentAttempt] = useState(0);

    const [gameOver, setGameOver] = useState(false)
    const [gameResult, setGameResult] = useState()
    const [showOverScreen, setShowOverScreen] = useState(false)
    const [canType, setCanType] = useState(false)

    const [opponentAttempts, setOpponentAttemps] = useState(Array(6).fill(''));
    const [opponentColors, setOpponentColors] = useState(Array(6).fill('wwwww'));

    const [shakeRow, setShakeRow] = useState(null)

    const [tag, setTag] = useState('')
    const [opponentTag, setOpponentTag] = useState('Waiting for player...')

    const attemptsRef = useRef(attempts);
    const currentAttemptRef = useRef(currentAttempt);

    const gameOverRef = useRef(gameOver)
    const canTypeRef = useRef(canType)

    const opponent_attemptsRef = useRef(opponentAttempts);
    const opponent_colorsRef = useRef(opponentColors);
    const opponent_tagRef = useRef(opponentTag)

    const colorsRef = useRef(colors);
    const shakeRowRef = useRef(shakeRow);

    const wordRef = useRef(word)

    const setAttemptRef = (e) => {
        attemptsRef.current = e;
        setAttempts(e);
    }

    const setCurrentAttemptRef = (e) => {
        currentAttemptRef.current = e;
        setCurrentAttempt(e);
    }

    const setColorsRef = (e) => {
        colorsRef.current = e;
        setColors(e);
    }

    const setShakeRowRef = (e) => {
        shakeRowRef.current = e;
        setShakeRow(e);
    }

    const setOpponentAttempsRef = (e) => {
        opponent_attemptsRef.current = e;
        setOpponentAttemps(e)
    }

    const setOpponentColorsRef = (e) => {
        opponent_colorsRef.current = e;
        setOpponentColors(e)
    }

    const setOpponentTagRef = (e) => {
        opponent_tagRef.current = e;
        setOpponentTag(e)
        setCanTypeRef(true)
    }

    const setWordRef = (e) => {
        wordRef.current = e;
        setWord(e)
    }

    const setGameOverRef = (e) => {
        gameOverRef.current = e;
        setGameOver(e)
    }

    const setCanTypeRef = (e) => {
        canTypeRef.current = e;
        setCanType(e)
    }

    useEffect(() => {
        addKeyListener();
        initializeSocket();
        getPlayerNames();
        getWordToGuess();
    }, [])

    useEffect(() => {
        if (gameOver) {
            setTimeout(() => {
                setShowOverScreen(true)
            }, 750)
        }
    }, [gameOver])

    const addKeyListener = async () => {
        if (eventAdded) return;

        // window.addEventListener('popstate', () => {
        //     if(!window.confirm('Do you want to forfeit this match?')) {
        //         history(`/match/${matchID}`)
        //         window.location.reload()
        //     }
        // })


        window.addEventListener('keydown', listener)

        eventAdded = true;
    }

    const listener = async (e) => {
        if (gameOverRef.current || !canTypeRef.current) return;

        let temp = [...attemptsRef.current];
        let current = currentAttemptRef.current;

        if (!(e.keyCode < 65 || e.keyCode > 90)) {
            const newLetter = e.key.toUpperCase();
            if (attemptsRef.current[current].length < 5) {
                temp[current] = attemptsRef.current[current] + newLetter;
                setAttemptRef(temp)
            }
        }

        if (e.keyCode === 8) {
            temp[current] = attemptsRef.current[current].substring(0, attemptsRef.current[current].length - 1);
            setAttemptRef(temp)
        }

        if (e.keyCode === 13) {
            let w = attemptsRef.current[current];
            if (w.length === 5 && await isWord(w)) {
                gradeAttempt();
            }
        }

        socket.send(JSON.stringify({
            type: 'update_game',
            from_id: playerID,
            opponent_attempts: attemptsRef.current,
            opponent_colors: colorsRef.current
        }))

        if (e.keyCode < 65 || e.keyCode > 90) return;
    }


    const initializeSocket = async () => {
        if (!socket) {
            let url = `ws://wordle-1v1-backend.herokuapp.com/ws/socket-server/${window.location.href.split('/')[4]}`;
            socket = new WebSocket(url);

            socket.onmessage = (e) => {
                const data = JSON.parse(e.data);

                getPlayerNames()
                getWordToGuess()

                if (data.type === 'update_game') {
                    if (data.from_id === playerID) return

                    setOpponentAttempsRef(data.opponent_attempts);
                    setOpponentColorsRef(data.opponent_colors);

                    if (hasWon(opponent_colorsRef.current)) {
                        setGameOverRef(true)
                        setGameResult('lost')
                    }
                }

                if (data.type === 'get_game_data') {
                    let attemptChanged = false;
                    let opponentChanged = false;

                    attemptsRef.current.forEach((e, i) => {
                        if (e !== '') attemptChanged = true;
                    })

                    opponent_attemptsRef.current.forEach((e, i) => {
                        if (e !== '') attemptChanged = true;
                    })

                    if (attemptChanged || opponentChanged) {
                        socket.send(JSON.stringify({
                            type: 'give_game_data',
                            from_id: playerID,
                            opponent_attempts: attemptsRef.current,
                            opponent_colors: colorsRef.current,
                            attempts: opponent_attemptsRef.current,
                            colors: opponent_colorsRef.current
                        }))
                    }
                }

                if (data.type === 'give_game_data') {
                    if (data.from_id === playerID) return;

                    setAttemptRef(data.attempts);
                    setColorsRef(data.colors);
                    setOpponentAttempsRef(data.opponent_attempts);
                    setOpponentColorsRef(data.opponent_colors);

                    if (hasWon(opponent_colorsRef.current)) {
                        setGameOverRef(true)
                        setGameResult('lost')
                    }

                    if (hasWon(colorsRef.current)) {
                        setGameOverRef(true)
                        setGameResult('won')
                    }

                    for (let i = 0; i < attemptsRef.current.length; i++) {
                        if (attemptsRef.current[i].length !== 5 || colorsRef.current[i] === 'wwwww') {
                            setCurrentAttemptRef(i);
                            break;
                        }
                    }
                }
            }
        }
    }

    const getPlayerNames = async () => {
        if (opponent_tagRef.current !== 'Waiting for player...') { return; }
        const response = await axios(`https://wordle-1v1-backend.herokuapp.com/wordle/get-player-tags/${matchID}`);

        if (localStorage.getItem('tag') == response.data[0].tag) {
            setTag(response.data[0].tag);
            setOpponentTagRef(response.data[1].tag);
        } else {
            setTag(response.data[1].tag);
            setOpponentTagRef(response.data[0].tag);
        }

    }

    const isWord = async (word) => {
        try {
            const response = await axios.get(`${dictionary_API_URL}/${word}`);
        } catch {
            setShakeRowRef(currentAttemptRef.current)
            setTimeout(() => { setShakeRowRef(null) }, 400)
            return false;
        }

        return true;
    }

    const gradeAttempt = () => {
        let newColors = '';
        for (let i = 0; i < wordRef.current.length; i++) {
            if (attemptsRef.current[currentAttemptRef.current][i] === wordRef.current[i]) newColors += 'g';
            else if (wordRef.current.split('').includes(attemptsRef.current[currentAttemptRef.current][i])) newColors += 'y';
            else newColors += 'd';
        }

        let temp = [...colorsRef.current];
        temp[currentAttemptRef.current] = newColors;
        setColorsRef(temp);
        setCurrentAttemptRef(currentAttemptRef.current + 1);

        if (hasWon(colorsRef.current)) {
            setGameOverRef(true)
            setGameResult('won')
        }
    }

    const handleKeyPress = (newLetter) => {
        let temp = [...attemptsRef.current];
        let current = currentAttemptRef.current;

        if (attemptsRef.current[current].length < 5) {
            temp[current] = attemptsRef.current[current] + newLetter;
            setAttemptRef(temp)
        }

        socket.send(JSON.stringify({
            type: 'update_game',
            from_id: playerID,
            opponent_attempts: attemptsRef.current,
            opponent_colors: colorsRef.current
        }))

        console.log(localStorage.getItem('tag'))
    }

    const handleEnter = async () => {
        let temp = [...attemptsRef.current];
        let current = currentAttemptRef.current;

        let word = attemptsRef.current[current];
        if (word.length === 5 && await isWord(word)) {
            gradeAttempt();
        }

        socket.send(JSON.stringify({
            type: 'update_game',
            from_id: playerID,
            opponent_attempts: attemptsRef.current,
            opponent_colors: colorsRef.current
        }))
    }

    const handleBackSpace = () => {
        let temp = [...attemptsRef.current];
        let current = currentAttemptRef.current;

        temp[current] = attemptsRef.current[current].substring(0, attemptsRef.current[current].length - 1);
        setAttemptRef(temp)

        socket.send(JSON.stringify({
            type: 'update_game',
            from_id: playerID,
            opponent_attempts: attemptsRef.current,
            opponent_colors: colorsRef.current
        }))
    }

    const getWordToGuess = async () => {
        const response = await axios.post(`https://wordle-1v1-backend.herokuapp.com/get-match/${matchID}`)

        const splitted = response.data.to_guess.split('.')
        setWordRef((splitted[0] === localStorage.getItem('opponent_to_guess') ? splitted[1] : splitted[0]))
    }

    const hasWon = (board) => {
        if (board.includes('ggggg')) return true;
        return false;
    }

    return (
        <>
            {!showOverScreen &&
                < div className="game">
                    <div className="boards" style={{ animationName: gameOver ? 'shift' : '' }}>
                        <WordleBoard tag={tag} attempts={attempts} colors={colors} shakeRow={shakeRowRef.current} />
                        <div className="vertical-line"></div>
                        <WordleBoard tag={opponentTag} attempts={opponentAttempts} colors={opponentColors} />
                    </div>
                    <div className='keyboard'>
                        <div>{keyboardRow1.map(e => { return <button onClick={() => handleKeyPress(e)}><kbd>{e}</kbd></button> })}</div>
                        <div>{keyboardRow2.map(e => { return <button onClick={() => handleKeyPress(e)}><kbd>{e}</kbd></button> })}</div>
                        <div>
                            <button onClick={handleEnter} style={{ paddingBottom: '6px', width: '60px' }}>
                                <IconContext.Provider value={{ size: '16px' }}><BsArrowReturnRight /></IconContext.Provider>
                            </button>
                            {keyboardRow3.map(e => { return <button onClick={() => handleKeyPress(e)}><kbd>{e}</kbd></button> })}
                            <button onClick={handleBackSpace} style={{ paddingBottom: '6px', width: '60px' }}>
                                <IconContext.Provider value={{ size: '16px' }}><BsBackspace /></IconContext.Provider>
                            </button>
                        </div>
                    </div>
                </div>
            }
            {showOverScreen &&
                <div className="game-over-screen">
                    <div class='game-over-box' style={{backgroundColor: (gameResult === 'won') ? 'rgb(217, 255, 210)' : 'rgb(255, 184, 184)'}}>
                        <h1 style={{color: (gameResult === 'won') ? '#0e7500' : 'red'}}>{`You ${gameResult}!`}</h1>
                        <p>Correct Answer: <span style={{fontWeight: 'bold'}}>{wordRef.current}</span></p>
                    </div>
                    <button onClick={() => { history('/'); window.location.reload(); }}>Play again</button>
                </div>
            }
        </>

    )
}