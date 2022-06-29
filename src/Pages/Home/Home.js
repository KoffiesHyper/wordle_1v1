import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import './Home.css'

let url = 'http://127.0.0.1:8000/wordle/join';

export default function Home() {
    const [tag, setTag] = useState('')

    const history = useNavigate()

    const joinGame = async () => {
        const response = await axios.post(url, {
            data: {
                tag: tag
            }
        })

        history(`/match/${response.data.id}`)
    }

    return (
        <div className="home-page">
            <input placeholder="Name" onChange={(event) => setTag(event.target.value)}></input>
            <button onClick={(event) => joinGame()}>Play against random</button>
        </div>
    )
}