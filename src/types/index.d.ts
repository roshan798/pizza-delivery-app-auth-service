import { Request } from 'express';
import { Tenant } from '../entity/Tenant';
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
export interface LoginUserRequest extends Request {
	body: {
		email: string;
		password: string;
	};
}

export interface AuthRequest extends Request {
	auth: {
		id?: string;
		sub: string;
		role: string;
		iat?: number;
		exp?: number;
		iss?: string;
		jti?: string;
	};
}

export type AuthCookie = {
	accessToken: string;
	refreshToken: string;
};

// tenant types
export interface TenantCreateRequest extends Request {
	body: Partial<Tenant>;
}

// tenant types
