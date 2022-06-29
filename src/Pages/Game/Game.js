import { useEffect, useState, useRef } from "react"
import WordleBoard from "../../Components/WordleBoard/WordleBoard"
import axios from 'axios';
import { useParams } from 'react-router-dom'

let eventAdded = false;

const dictionary_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

let socket;

export default function Game() {
    const params = useParams();

    const [playerID, setPlayerID] = useState(Math.random(10))
    const [matchID, setMatchID] = useState(params.match_id)

    const [attempts, setAttempts] = useState(Array(6).fill(''));
    const [colors, setColors] = useState(Array(6).fill('wwwww'));
    const [word, setWord] = useState('PLANT');
    const [currentAttempt, setCurrentAttempt] = useState(0);

    const [opponentAttempts, setOpponentAttemps] = useState(Array(6).fill(''));
    const [opponentColors, setOpponentColors] = useState(Array(6).fill('wwwww'));

    const [shakeRow, setShakeRow] = useState(null)

    const attemptsRef = useRef(attempts);
    const currentAttemptRef = useRef(currentAttempt);
    const colorsRef = useRef(colors);
    const shakeRowRef = useRef(shakeRow);

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

    useEffect(() => {
        addKeyListener();
        
        if(!socket){
            let url = `ws://127.0.0.1:8000/ws/socket-server/${window.location.href.split('/')[4]}`;
            socket = new WebSocket(url);

            socket.onmessage = (e) => {
                const data = JSON.parse(e.data);
    
                if (data.from_id === playerID) return
    
                setOpponentAttemps(data.opponent_attempts);
                setOpponentColors(data.opponent_colors);
            }
        }        
    }, [])

    const addKeyListener = async () => {
        if (eventAdded) return;
        window.addEventListener('keydown', async (e) => {
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
                let word = attemptsRef.current[current];
                if (word.length === 5 && await isWord(word)) {
                    gradeAttempt();
                }
            }

            socket.send(JSON.stringify({
                from_id: playerID,
                opponent_attempts: attemptsRef.current,
                opponent_colors: colorsRef.current
            }))

            if (e.keyCode < 65 || e.keyCode > 90) return;


        })

        eventAdded = true;
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
        for (let i = 0; i < word.length; i++) {
            if (attemptsRef.current[currentAttemptRef.current][i] === word[i]) newColors += 'g';
            else if (word.split('').includes(attemptsRef.current[currentAttemptRef.current][i])) newColors += 'y';
            else newColors += 'd';
        }

        let temp = [...colorsRef.current];
        temp[currentAttemptRef.current] = newColors;
        setColorsRef(temp);
        setCurrentAttemptRef(currentAttemptRef.current + 1);
    }

    return (
        <div>
            <WordleBoard attempts={attempts} colors={colors} shakeRow={shakeRowRef.current} />
            <WordleBoard attempts={opponentAttempts} colors={opponentColors} />
        </div>
    )
}