export interface BaseStore {
    fetchData: (params?: any) => void;
    data: any[] | Record<string, any>;
    total: number;
    fetchProgress: boolean;
    fetchError: boolean;
    fetchErrorText: string;
    fetchDone: boolean;
    reset: () => void;
}

export interface ArrayStore extends BaseStore {
    data: any[];
}

export interface ObjectStore extends BaseStore {
    data: Record<string, any>;
}

export interface Stores {
    $factionsStore: ArrayStore;
    $racesStore: ArrayStore;
    $raceStore: ObjectStore;
    $charactersStore: ArrayStore;
}

export const stores: Stores;