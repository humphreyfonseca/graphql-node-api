import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import db from './models';
import schema from './graphql/schema';
import { graphql } from 'graphql';

class App{
    public express: express.Application;

    constructor(){
        this.express = express();
        this.middleware();
    }

    private middleware(): void{
        /*this.express.use('/hello', (req: express.Request, res: express.Response, next: express.NextFunction) =>{
            res.send({
                hello: 'Hello World!'
            })
        });*/

        this.express.use('/graphql', 
            
            (req, res, next) => {
                req['context'] = {};
                req['context'].db = db;
                next();
            },

            graphqlHTTP((req) => ({
                schema: schema,
                //graphiql: process.env.NODE_ENV === 'development'
                graphiql: true,
                context: req['context']
            }))
        );

    }
}

export default new App().express;