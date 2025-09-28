import { Request } from 'express';
import { Tenant } from '../entity/Tenant';
export interface UserData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role: ?string; // for now it is optional// TODO make it required
	tenantId?: number; // for now it is optional// TODO make it required
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
		tenantId?: string;
		iat?: number;
		exp?: number;
		iss?: string;
		jti?: string;
	};
}
export interface AuthenticatedRequest<T> extends Request {
	auth: AuthRequest['auth'];
	body: T;
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

export interface UserCreateRequest extends Request {
	body: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
		tenantId: number;
	};
}

export interface UserUpdateRequest extends Request {
	body: Partial<Omit<UserCreateRequest['body'], 'password'>>;
}
