
export interface CreateUser{
    name: string 
    email: string 
    password: string 
}

export interface User{
    id: string 
    name: string 
    email: string 
    password: string 
    role: string 
}

export interface UserUpdateInfo{
    role: string 
}