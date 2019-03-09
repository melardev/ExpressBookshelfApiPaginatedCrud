const Todo = require('./../config/db.config').Todo;
const TodoResponseDto = require('./../dtos/responses/todos/todo.dto');
const GenericResponseDto = require("../dtos/responses/shared/generic.dto");

// Melardev ! Melardev! your video tutorials are overcomplicated!
// Sure, they have to be, this is not a hello-word copy paste thing from the official docs ....
// if you still want the dead simple and useless example take a look at getAllSimple functions at the end of this file

exports.getAll = (req, res, next) => {
    Promise.all([
        Todo.query('orderBy', 'created_at', 'DESC').fetchPage({
            page: req.page,
            pageSize: req.pageSize,
            debug: process.env.DEBUG,
            columns: ['id', 'title', 'completed', 'created_at', 'updated_at']
        }),
        Todo.query().count('* as todoCount')])
        .then(results => {
            const todos = results[0].serialize();
            const totalTodosCount = results[1][0].todoCount;
            return res.json(TodoResponseDto.buildPagedList(todos, req.page, req.pageSize, totalTodosCount, req.baseUrl));
        }).catch(err => {
        throw err;
    });
};


exports.getCompleted = (req, res, next) => {
    return Promise.all([
        Todo.query(queryBuilder => {
            queryBuilder.orderBy('created_at', 'DESC');
            queryBuilder.where('completed', '=', true)
        }).fetchPage({
            page: req.page,
            pageSize: req.pageSize,
            debug: process.env.DEBUG,
            columns: ['id', 'title', 'completed', 'created_at', 'updated_at']
        }),
        Todo.query().where('completed', true).count('* as todoCount')])
        .then(results => {
            const todos = results[0].serialize();
            const totalTodosCount = results[1][0].todoCount;
            return res.json(TodoResponseDto.buildPagedList(todos, req.page, req.pageSize, totalTodosCount, req.baseUrl));
        }).catch(err => {
            throw err;
        });
};

exports.getPending = (req, res, next) => {
    return Promise.all([
        Todo.where({completed: false}).query('orderBy', 'created_at', 'desc').fetchPage({
            page: req.page,
            pageSize: req.pageSize,
            columns: ['id', 'title', 'completed', 'created_at', 'updated_at'],
            debug: process.env.DEBUG,
        }),
        Todo.query({where: {completed: false}}).count({debug: true})])
        .then(results => {
            const todos = results[0].serialize();
            const totalTodosCount = results[1];
            return res.json(TodoResponseDto.buildPagedList(todos, req.page, req.pageSize, totalTodosCount, req.baseUrl));
        }).catch(err => {
            throw err;
        });
};

exports.getById = (req, res, next) => {
    Todo.where('id', req.params.id).fetch({
        debug: process.env.DEBUG || true,
    }).then(todo => {
        if (todo == null)
            return res.status(404).json(GenericResponseDto.buildWithErrorMessages('Todo not found'));
        return res.json(TodoResponseDto.buildDetails(todo.toJSON()));
    }).catch(err => {
        return res.json(GenericResponseDto.buildWithErrorMessages(err.message));
    });
};

exports.create = function (req, res, next) {
    const {title, description, completed} = req.body;
    Todo.create({title, description, completed}).then(todo => {
        return res.json(GenericResponseDto.buildSuccessWithDtoAndMessages(TodoResponseDto.buildDetails(todo.toJSON()), 'Todo created successfully'));
    }).catch(err => {
        return res.json(GenericResponseDto.buildWithErrorMessages(err.message));
    });
};

exports.update = function (req, res, next) {

    Todo.where({id: req.params.id}).fetch({debug: process.env.DEBUG}).then(todo => {
        if (todo == null)
            return res.status(404).json(GenericResponseDto.buildWithErrorMessages('Todo not found'));
        const {title, description, completed} = req.body;

        todo.set('title', title);

        if (description != null)
            todo.set('description', description);
        
        todo.set('completed', completed ? 1 : 0); // bookshelf interprets booleans as 1 or 0, to update successfully use 0 or 1

        todo.save().then(todo => {
            return res.json(GenericResponseDto.buildSuccessWithDtoAndMessages(TodoResponseDto.buildDetails(todo.serialize()), 'Todo updated successfully'));
        }).catch(err => {
            return res.json(GenericResponseDto.buildWithErrorMessages(err.message));
        });
    }).catch(err => {
        return res.json(GenericResponseDto.buildWithErrorMessages(err.message));
    });
};

exports.delete = function (req, res, next) {
    // Todo.where('id', req.params.id).destroy().then(result => {
    Todo.where({id: req.params.id}).fetch({debug: process.env.DEBUG}).then(todo => {
        if (todo == null)
            return res.status(404).json(GenericResponseDto.buildWithErrorMessages('Todo not found'));
        // I show you this way because it is most likely in a real world app you would need to make some
        // checks first with te destroyed model.
        todo.destroy().then(result => {
            return res.json(GenericResponseDto.buildSuccessWithMessages('Todo deleted successfully'));
        }).catch(err => {
            return res.json(GenericResponseDto.buildWithErrorMessages(err.message));
        });
    });
};

exports.deleteAll = function (req, res, next) {
    Todo.where('id', '!=', 0).destroy({debug: process.env.DEBUG}).then(result => {
        return res.json(GenericResponseDto.buildSuccessWithMessages('Todos deleted successfully'));
    }).catch(err => {
        return res.json(GenericResponseDto.buildWithErrorMessages(err.message));
    });
};


// Simple
exports.getAllSimple = (req, res, next) => {
    Todo.query('orderBy', 'created_at', 'DESC').fetchAll({
        debug: process.env.DEBUG,
        columns: ['id', 'title', 'completed', 'created_at', 'updated_at']
    }).then(results => {
        const todos = results.serialize();
        return res.json(todos);
    }).catch(err => {
        throw err;
    });
};


exports.getCompletedSimple = (req, res, next) => {
    Todo.query(queryBuilder => {
        queryBuilder.orderBy('created_at', 'DESC');
        queryBuilder.where('completed', '=', false)
    }).fetchAll({
        debug: process.env.DEBUG,
        columns: ['id', 'title', 'completed', 'created_at', 'updated_at']
    }).then(todos => {
        return res.json(todos.serialize());
    }).catch(err => {
        throw err;
    });
};

exports.getPendingSimple = (req, res, next) => {
    Todo.query(queryBuilder => {
        queryBuilder.orderBy('created_at', 'DESC');
        queryBuilder.where('completed', '=', false)
    }).fetchAll({
        debug: process.env.DEBUG,
        columns: ['id', 'title', 'completed', 'created_at', 'updated_at']
    }).then(todos => {
        return res.json(todos.serialize());
    }).catch(err => {
        throw err;
    });
};

exports.getByIdSimple = (req, res, next) => {
    Todo.where('id', req.params.id).fetch({
        debug: process.env.DEBUG || true,
    }).then(todo => {
        if (todo == null)
            return res.status(404).json({message: 'not found'});
        else
            return res.json(todo.toJSON());
    }).catch(err => {
        return res.json({message: err.message});
    });
};
