import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class LoginUserDto {
   
    @IsNotEmpty()
    @IsEmail()
    email: string;

    
    @IsNotEmpty()
    @IsStrongPassword({minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1})
    password: string
}


export class RegisterUserDto{

    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    username: string;
    
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsStrongPassword({minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1})
    password: string;

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;


}