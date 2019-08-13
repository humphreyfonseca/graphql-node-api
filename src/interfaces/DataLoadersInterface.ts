import { DataLoaderParam } from './DataLoaderParamInterface';
import * as DataLoader from 'dataloader';

import { UserInstance } from './../models/UserModel';
import { PostInstance } from '../models/PostModel';


export interface DataLoaders{

    userLoader: DataLoader<DataLoaderParam<number>, UserInstance>;
    postLoader: DataLoader<DataLoaderParam<number>, PostInstance>;

}