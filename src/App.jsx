import { useEffect, useState } from 'react'
import Admin from './pages/Admin.jsx'
import Gift from './pages/Gift.jsx'
import Landing from './pages/Landing.jsx'
import './App.css'

function parseHash() {
  const raw = window.location.hash.slice(1) || '/'
  const [path, query = ''] = raw.split('?')
  const params = new URLSearchParams(query)
  return { path, params }
}

function useHashRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export default function App() {
  const { path, params } = useHashRoute()

  let page
  if (path.startsWith('/admin')) {
    page = <Admin />
  } else if (path.startsWith('/gift')) {
    page = <Gift data={params.get('d') || ''} />
  } else if (path.startsWith('/g/')) {
    page = <Gift slug={decodeURIComponent(path.slice('/g/'.length))} />
  } else {
    page = <Landing />
  }

  return <div className="app-shell">{page}</div>
}
