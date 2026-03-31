import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './index.css' // Tailwind directives

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center" className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="hero flex flex-col items-center gap-4 mb-6">
          <img src={heroImg} className="w-40 h-40" alt="Hero" />
          <div className="flex gap-4">
            <img src={reactLogo} className="w-12 h-12" alt="React logo" />
            <img src={viteLogo} className="w-12 h-12" alt="Vite logo" />
          </div>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">Get started</h1>
          <p className="text-gray-700">
            Edit <code className="bg-gray-200 px-1 rounded">src/App.jsx</code> and save to test <code className="bg-gray-200 px-1 rounded">HMR</code>
          </p>
        </div>
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
          onClick={() => setCount(count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <section id="next-steps" className="p-6 bg-white">
        <div id="docs" className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Documentation</h2>
          <p className="text-gray-600 mb-4">Your questions, answered</p>
          <ul className="flex gap-4">
            <li>
              <a href="https://vite.dev/" target="_blank" className="flex items-center gap-2 hover:text-blue-500">
                <img className="w-6 h-6" src={viteLogo} alt="Vite" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" className="flex items-center gap-2 hover:text-blue-500">
                <img className="w-6 h-6" src={reactLogo} alt="React" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}

export default App