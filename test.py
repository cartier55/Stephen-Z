from facebook_scraper import get_posts, set_user_agent
import pprint as pp
# set_user_agent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")

for post in get_posts('OfficialMensHumor', extra_info=True, options={"reactions": True, "reactors": True, "allow_extra_requests": True},  pages=5):
    # print(post['image'])
    pp.pprint(post)
    break
    # print(post['text'][:50])
