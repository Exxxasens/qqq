from hashlib import md5

SECRET = '1231231fdsfsa'

def create_user(username, password):
    user = {
        'username': username,
        'password': md5(str(password + SECRET).encode('utf-8')).hexdigest(),
        'games_played': 0,
        'won': 0
    }

    return user


def compare_passwords(password, hashed_pass):
    h = md5(str(password + SECRET).encode('utf-8')).hexdigest()
    if h == hashed_pass:
        return True

    return False
