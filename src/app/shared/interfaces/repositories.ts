export interface Repositories {
    source: Repository;
    target: Repository;
}

interface Repository {
    url: string;
    username?: string;
    password?: string;
    remote?: string;
    ref?: string;
    remoteRef?: string;
}
