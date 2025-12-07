import React, { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from './components/Card'
import data from '../newData.json'

function shuffleArray(arr, seed = null){
  const a = arr.slice()
  for(let i = a.length -1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App(){
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [gender, setGender] = useState('all')
  const [shuffleKey, setShuffleKey] = useState(0)

  // debounce search input
  useEffect(()=>{
    const t = setTimeout(()=> setQuery(searchTerm), 300)
    return ()=>clearTimeout(t)
  },[searchTerm])

  const items = useMemo(()=>{
    const q = (query || '').trim().toLowerCase()
    let filtered = data.filter(d=>{
      if(gender !== 'all' && d.gender !== gender) return false
      if(!q) return true
      const name = `${d.name.first} ${d.name.last}`.toLowerCase()
      return name.includes(q) || (d.email || '').toLowerCase().includes(q) || (d.location?.city || '').toLowerCase().includes(q)
    })
    if(shuffleKey > 0){
      filtered = shuffleArray(filtered, shuffleKey)
    }
    return filtered
  },[query, gender, shuffleKey])

  return (
    <div className="app">
      <header className="header">
        <h1>Card Showcase</h1>
        <div className="controls">
          <input aria-label="Search" placeholder="Search name, email, city..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
          <select value={gender} onChange={e=>setGender(e.target.value)} aria-label="Filter by gender">
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button onClick={()=>setShuffleKey(k=>k+1)} aria-label="Shuffle cards">Shuffle</button>
        </div>
      </header>

      <main>
        <motion.div layout key={shuffleKey} className="grid">
          <AnimatePresence>
            {items.map((it, idx)=> (
              <motion.div layout key={it.email || `${idx}-${it.name.first}`} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}>
                <Card person={it} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {items.length === 0 && (
          <div className="empty">No items match your search.</div>
        )}
      </main>
      <footer className="footer">Built with React + Framer Motion</footer>
    </div>
  )
}
