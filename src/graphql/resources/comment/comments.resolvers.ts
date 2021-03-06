import { ResolverContext } from './../../../interfaces/ResolverContextInterface';
import { throwError } from './../../../util/utils';
import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { authResovers } from './../../../composable/auth.resolver';
import { CommentInstance } from './../../../models/CommentsModel';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { handleError } from '../../../util/utils';
import { compose } from '../../../composable/composable.resolver';
import { DataLoaders } from '../../../interfaces/DataLoadersInterface';

export const commentResolvers = {

    Comment: {

        user: (comment, {postId, first= 10, offset=0}, {db, dataloaders: {userLoader}}: {db: DbConnection, dataloaders: DataLoaders}, info: GraphQLResolveInfo) => {
            return userLoader
                .load({key: comment.get('user'), info})
                .catch(handleError);   
        },
        post: (comment, {postId, first= 10, offset=0}, {db, dataloaders: {postLoader}}: {db: DbConnection, dataloaders: DataLoaders}, info: GraphQLResolveInfo) => {
            return postLoader
                .load({ key: comment.get('post'), info})
                .catch(handleError);
        }
    },

    Query:{

        commentsByPost: compose()((parent, {postId, first= 10, offset=0}, context: ResolverContext, info: GraphQLResolveInfo) => {
            postId = parseInt(postId);

            return context.db.Comment
            .findAll({
                where: {post: postId},
                limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info, {keep: undefined})
                })
                .catch(handleError);
        })
    },

    Mutation: {

        createComment: compose(...authResovers)((parent, {input}, {db, authUser}: {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) => {
            input.user = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .create(input, {transaction: t});
            })
            .catch(handleError);
        }),
        updateComment: compose(...authResovers)((parent, {id, input}, {db, authUser}: {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .findById(id)
                    .then((comment: CommentInstance) => {
                        throwError(!comment, `Comment with id ${id} not found!`);
                        throwError(comment.get('user') != authUser.id, `Unauthorized! You can only edit comment by yourself!`);
                        input.user = authUser.id;
                        return comment.update(input, {transaction: t});
                    });
            })
            .catch(handleError);
        }),
        deleteComment: compose(...authResovers)((parent, {id}, {db, authUser}: {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .findById(id)
                    .then((comment: CommentInstance) => {
                        throwError(!comment, `Comment with id ${id} not found!`);
                        throwError(comment.get('user') != authUser.id, `Unauthorized! You can only delete comment by yourself!`);
                        return comment.destroy({transaction: t})
                            .then(comment => !!comment);
                    });
            })
            .catch(handleError);
        })
    }

};