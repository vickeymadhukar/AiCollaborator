import React from 'react'
import { Route,BrowserRouter,Routes } from 'react-router-dom';
import Loginspage from '../screen/Loginspage';
import RegisterPage from '../screen/RegisterPage';
import Homepage from '../screen/Homepage';
import Project from '../screen/Project';
import Landing from '../screen/Landing';
const Approutes = () => {
  return (
    <div>
      <BrowserRouter>
            <Routes>
              <Route path='/' element={
                   <Landing/>
                }
                />
              
                <Route path='/home' element={
                   <Homepage/>
                }
                />
                <Route path='/login' element={
                    <Loginspage/>
                }
                />
                <Route path='/register' element={
    <RegisterPage/>
                }
                />
                  <Route path='/project' element={
    <Project/>
                }
                />

            </Routes>
      
      </BrowserRouter>
    </div>
  )
}
export default Approutes
