import * as graphqlFields from 'graphql-fields';
import { DataLoaders } from './../../../interfaces/DataLoadersInterface';
import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { authResovers } from './../../../composable/auth.resolver';
import { PostInstance } from './../../../models/PostModel';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { handleError, throwError } from '../../../util/utils';
import { compose } from '../../../composable/composable.resolver';
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';


export const postResolvers = {

    Post: {

        author: (post, args, {db, dataloaders: {userLoader}} : {db: DbConnection, dataloaders: DataLoaders}, info: GraphQLResolveInfo) =>{
            return userLoader
                .load({key: post.get('author'), info})
                .catch(handleError);            
        },

        comments: (post, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) =>{
            return context.db.Comment
                .findAll({
                    where: {post: post.get('id')},
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info)
                })
                .catch(handleError);
        },
    },

    Query: {

        posts: (parent, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) =>{
            return context.db.Post
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .catch(handleError);
        },

        post: (parent, {id}, context: ResolverContext, info: GraphQLResolveInfo) =>{
            id = parseInt(id);
            return context.db.Post
                .findById(id, {
                    attributes: context.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .then((post: PostInstance) => {
                    throwError(!post, `Post with id ${id} not found!`);
                    return post;
                })
                .catch(handleError);
        },
    },

    Mutation:{

        createPost: compose(...authResovers)((parent, {input}, {db, authUser} : {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) =>{
            input.author = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .create(input, {transaction: t});
            })
            .catch(handleError);
        }),

        updatePost: compose(...authResovers)((parent, {id, input}, {db, authUser} : {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) =>{
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post 
                    .findById(id)
                    .then((post: PostInstance) =>{
                        throwError(!post, `Post with id ${id} not found!`);
                        throwError(post.get('author') != authUser.id, `Unauthorized! You can only edit post by yourself!`);
                        input.author = authUser.id;
                        return post.update(input, {trasaction: t});
                    });
            })
            .catch(handleError);
        }),

        deletePost: compose(...authResovers)((parent, {id}, {db, authUser} : {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) =>{
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .findById(id)
                    .then((post: PostInstance) => {
                        throwError(!post, `Post with id ${id} not found!`);
                        throwError(post.get('author') != authUser.id, `Unauthorized! You can only delete post by yourself!`);                        
                        return post.destroy({transaction: t})
                            .then(post => !!post);
                    })
            })
            .catch(handleError);
        }),

    }
}