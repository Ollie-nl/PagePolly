function Error({ statusCode }) {
    return (
        <p>
            {statusCode
                ? `Server-side error occurred: ${statusCode}`
                : 'An error occurred on client-side'}
        </p>
    );
}

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
