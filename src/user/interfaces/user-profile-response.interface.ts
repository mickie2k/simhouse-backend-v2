export interface UserProfileResponse {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profileImageUrl: string | null;
}
