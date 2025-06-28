import { Request } from 'express';
export interface UserData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}
export interface RegisterUserRequest extends Request {
	body: UserData;
}
export interface User extends Omit<UserData, 'password'> {
	id: number;
	role: string;
}
export interface LoginUserRequest extends request {
	body: {
		email: string;
		password: string;
	};
}
