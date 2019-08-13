import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { GraphQLResolveInfo } from 'graphql';

import { UserInstance } from './../../../models/UserModel';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { Transaction } from 'sequelize';
import { handleError, throwError } from '../../../util/utils';
import { compose } from '../../../composable/composable.resolver';
import { authResover, authResovers } from '../../../composable/auth.resolver';
import { verifyTokenResolver } from '../../../composable/verify-token.resolver';
import { RequestedFields } from '../../ast/RequestedFields';
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';


export const userResolvers = {

    User: {

        posts: (user: UserInstance, { first = 10, offset = 0 }, {db, requestedFields} : {db: DbConnection, requestedFields: RequestedFields}, info: GraphQLResolveInfo) =>{
            return db.Post
                .findAll({
                    where: {author: user.get('id')},
                    limit: first,
                    offset: offset,
                    attributes: requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .catch(handleError);
                
        }

    },

    Query: {

        users: (parent, { first = 10, offset = 0 }, {db, requestedFields} : {db: DbConnection, requestedFields: RequestedFields}, info: GraphQLResolveInfo) =>{
            return db.User
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .catch(handleError);
        },

        user: (parent, {id}, context: ResolverContext, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return context.db.User
                .findById(id, {
                    attributes: context.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .then((user: UserInstance) => {
                    throwError(!user, `User with id ${id} not found!`);
                    return user;
                })
                .catch(handleError);
        },

        currentUser: compose(...authResovers)((parent, args, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.User
                .findById(context.authUser.id, {
                    attributes: context.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .then((user: UserInstance) =>{
                    throwError(!user, `User with id ${context.authUser.id} not found!`);
                    return user;
                }).catch(handleError);
           
            
        }),
    },

    Mutation: {

        createUser: (parent, {input}, {db}: {db: DbConnection}, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .create(input, {transaction: t});
            })
            .catch(handleError);    
        },

        updateUser: compose(...authResovers)((parent, {input}, {db, authUser}: {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) =>{
                        throwError(!user, `User with id ${authUser.id} not found!`);
                        return user.update(input, {transaction: t});
                    });
            })
            .catch(handleError);
        }),
        updateUserPassword: compose(...authResovers)((parent, {input}, {db, authUser}: {db: DbConnection, authUser:AuthUser}, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) =>{
                        throwError(!user, `User with id ${authUser.id} not found!`);
                        return user.update(input, {transaction: t})
                            .then((user: UserInstance) => !!user);
                    });
            })
            .catch(handleError);
        }),
        
        deleteUser: compose(...authResovers)((parent, args, {db, authUser}: {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `User with id ${authUser.id} not found!`);
                        return user.destroy({transaction: t})
                            .then(user => !!user);
                    });
            })
            .catch(handleError);
        })

        /*baseUser: (parent, {input}, {db}: {db: DbConnection}, info: GraphQLResolveInfo) => {
            
        }*/
    }
}