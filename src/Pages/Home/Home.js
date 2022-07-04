import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import './Home.css'

let url = 'http://127.0.0.1:8000/wordle/join';
const dictionary_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const titleLetters = 'WORDLE 1v1'.split('')

export default function Home() {
    const [tag, setTag] = useState('')
    const [opponentToGuess, setOpponentToGuess] = useState('')
    const [titleColors, setTitleColors] = useState([])
    const [errorMessage, setErrorMessage] = useState('')

    const history = useNavigate()

    useEffect(() => {
        let temp = []
        titleLetters.forEach((e, i) => {
            temp[i] = randomColor()
        })
        setTitleColors(temp)
    }, [])

    const joinGame = async () => {

        if(tag.length === 0){
            setErrorMessage('Enter a Name')
            return;
        }


        if(opponentToGuess.length !== 5 || !await isWord(opponentToGuess)){
            setErrorMessage('Enter a valid English word (5 letters)')
            return;
        }

        localStorage.setItem('tag', tag)
        localStorage.setItem('opponent_to_guess', opponentToGuess.toUpperCase())

        const response = await axios.post(url, {
            data: {
                tag: tag,
                to_guess: opponentToGuess.toUpperCase()
            }
        })

        history(`/match/${response.data.id}`)
    }

    const randomColor = () => {
        const random = Math.random()
        if(random < .7) return 'transparent'
        else if(random >= .7 && random < .8) return 'rgb(125, 247, 125)'
        else if(random >= .8 && random < .9) return 'rgb(255, 255, 0)'
        else if(random >=.9) return 'rgb(158, 158, 158)'
    }

    const isWord = async (word) => {
        try {
            const response = await axios.get(`${dictionary_API_URL}/${word}`);
        } catch {
            return false;
        }

        return true;
    }

    return (
        <div className="home-page">
            <div className="title">
                {
                    titleLetters.map((e, i) => { 
                        const random = titleColors[i]; 
                        return <div className='block' style={{backgroundColor: random, color: (random === 'rgb(255, 255, 0)' || random === 'rgb(125, 247, 125)') ? 'black' : 'white'}} >{e}</div> })
                }
            </div>
            <div className="form">
                <span className="heading">Name</span>
                <input placeholder="i.e. John" onChange={(event) => setTag(event.target.value)}></input>
                <span className="heading">Word for Opponent</span>
                <input placeholder="i.e. Plant (5 letters)" onChange={(event) => setOpponentToGuess(event.target.value)}></input>
                <button onClick={(event) => joinGame()}>Play</button>
                <p style={{fontFamily: 'custom1', color: 'red', fontSize: '14px'}}>{errorMessage}</p>
            </div>
        </div>
    )
}