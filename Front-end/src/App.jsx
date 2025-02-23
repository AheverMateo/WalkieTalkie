import { Route, Routes } from "react-router-dom"
import WalkieTalkie from "./components/WalkieTalkie"
import { ToastContainer } from "react-toastify";
function App() {

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<WalkieTalkie/>} />
      </Routes>
    </div>
  )
}

export default App
