import { createContext, useContext, useState } from "react";


export const userContext = createContext();

export default function UserLoginProvider({children}){
    const [userId,setUserId] =  useState("")
    const [user,setUser] = useState()
    const [token,setToken] = useState()

    return (
        <userContext.Provider value={{user,setUser,token,setToken,userId,setUserId}}>
            {children}
        </userContext.Provider>
    )

}
