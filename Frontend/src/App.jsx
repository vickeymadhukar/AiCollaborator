import React from 'react'
import Approutes from './Routes/Approutes'
import { UserProvider } from './context/user.context'
const App = () => {
  return (
    <div >
      <UserProvider>
      <Approutes/>
      </UserProvider>
    </div>
  )
}

export default App
