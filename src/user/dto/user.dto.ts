
export class CreateUserDto{

    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleid: number;
}

export class FindUserDto{
    email: string;
}