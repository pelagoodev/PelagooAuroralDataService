export interface RequestBody {
    name: string;
    age: number;
}

export interface ResponseData {
    message: string;
    data?: RequestBody;
}