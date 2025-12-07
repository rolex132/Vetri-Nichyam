import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

const LIKE_KEY = 'card_showcase_likes_v1'

export default function Card({ person }){
  const [flipped, setFlipped] = useState(false)
  const [liked, setLiked] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const imgRef = useRef(null)

  const fullName = `${person.name.title} ${person.name.first} ${person.name.last}`
  const id = person.email || `${person.name.first}-${person.name.last}`

  useEffect(()=>{
    try{
      const raw = localStorage.getItem(LIKE_KEY)
      const map = raw ? JSON.parse(raw) : {}
      setLiked(Boolean(map[id]))
    }catch(e){ }
  },[id])

  useEffect(()=>{
    try{
      const raw = localStorage.getItem(LIKE_KEY)
      const map = raw ? JSON.parse(raw) : {}
      if(liked) map[id] = true
      else delete map[id]
      localStorage.setItem(LIKE_KEY, JSON.stringify(map))
    }catch(e){}
  },[liked,id])

  function handleKeyDown(e){
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setFlipped(f=>!f)
    }
  }

  function handleImgError(){
    setImgError(true)
    setImgLoaded(true)
  }

  return (
    <div className="card-wrap">
      <motion.div
        className="card"
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        onKeyDown={handleKeyDown}
        onClick={()=>setFlipped(p=>!p)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <div className="card-face card-front">
          {!imgLoaded && <div className="avatar-skeleton" />}
          <img
            ref={imgRef}
            className={`avatar ${imgLoaded? 'visible':''}`}
            src={imgError ? '/fallback-avatar.png' : person.picture}
            alt={fullName}
            onLoad={()=>setImgLoaded(true)}
            onError={handleImgError}
          />
          <h3>{fullName}</h3>
          <p className="muted">{person.location?.city}, {person.location?.country}</p>
          <div className="meta">
            <button className={`like ${liked? 'liked':''}`} onClick={(e)=>{ e.stopPropagation(); setLiked(v=>!v) }} aria-pressed={liked} aria-label={liked? 'Unlike' : 'Like'}>
              {liked ? '♥ Liked' : '♡ Like'}
            </button>
            <button className="flip" onClick={(e)=>{ e.stopPropagation(); setFlipped(true) }} aria-label="View details">View</button>
          </div>
        </div>

        <div className="card-face card-back">
          <h3>{fullName}</h3>
          <p><strong>Email:</strong> {person.email}</p>
          <p><strong>Phone:</strong> {person.cell}</p>
          <p><strong>Location:</strong> {person.location?.city}, {person.location?.state}</p>
          <div className="meta">
            <button onClick={(e)=>{ e.stopPropagation(); setFlipped(false) }} aria-label="Close details">Close</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
