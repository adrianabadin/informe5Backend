export abstract class AuthError extends Error{
    public text:string
    constructor(public errorContent?:any,public message:string ="Error de autenticacion",public code:number=1000){
        super(message)
        this.text=message
        this.name="Auth Error"
        this.code=code
    }
}

export class UserCreateError extends AuthError{
    constructor(errorContent?:any,message:string="Error al crear el usuario",code:number=1001){
        super(errorContent,message,code)
    }
}
export class UserExistsError extends AuthError{
    constructor(errorContent?:any,message="El usuario ya existe",code=1002){
        super(errorContent,message,code)
    }
}