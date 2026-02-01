import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
 <div className="p-8 bg-base-100 min-h-screen">
      <h1 className="text-4xl font-bold text-primary mb-4">
        Hello React + daisyUI 🌼
      </h1>
      <button className="btn btn-primary mr-2">Primary Button</button>
      <button className="btn btn-secondary">Secondary Button</button>
      <div className="alert alert-success mt-4">
        This is a daisyUI alert!
      </div>
    </div>
  )
}

export default App
