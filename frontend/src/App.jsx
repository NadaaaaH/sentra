import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Beranda from './pages/Beranda'
import JelajahiPeta from './pages/JelajahiPeta'
import SmartMatching from './pages/SmartMatching'
import Data from './pages/Data'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/peta" element={<JelajahiPeta />} />
        <Route path="/smart-matching" element={<SmartMatching />} />
        <Route path="/data" element={<Data />} />
      </Route>
    </Routes>
  )
}

export default App