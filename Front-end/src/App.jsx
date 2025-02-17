import { Route, Routes } from "react-router-dom"
import WalkieTalkie from "./components/WalkieTalkie"

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<WalkieTalkie/>} />
      </Routes>
    </div>
  )
}

export default App
