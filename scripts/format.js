function format(type, item) {
  if (type === "reddit") {
    const {
      title,
      created_utc,
      selftext_html,
      score,
      preview,
      permalink,
      subreddit,
      id,
      is_self,
      media,
      is_video,
      localize,
      the_new_excerpt,
      original_created_utc,
      source_updated_at,
      author,
      over_18,
    } = item;
    return {
      author,
      the_new_excerpt,
      original_created_utc,
      localize,
      title,
      created_utc,
      selftext_html,
      score,
      preview,
      permalink,
      subreddit,
      id,
      is_self,
      media,
      is_video,
      source_updated_at,
      sensitive: over_18,
    };
  } else if (type === "hn") {
    const {
      created_at,
      title,
      url,
      author,
      points,
      num_comments,
      _tags,
      objectID,
      original_created_at,
      localize,
      source_updated_at,
      image,
    } = item;
    return {
      created_at,
      title,
      url,
      author,
      points,
      num_comments,
      _tags,
      objectID,
      original_created_at,
      localize,
      source_updated_at,
      image,
    };
  } else if (type === "tweet") {
    let {
      created_at,
      id_str,
      full_text,
      display_text_range,
      entities,
      user,
      retweet_count,
      favorite_count,
      possibly_sensitive,
      original_created_at,
      localize,
      source_updated_at,
      retweeted_status,
      quoted_status,
    } = item;
    const { name, screen_name, profile_image_url_https } = user;
    if (retweeted_status) {
      retweeted_status = format("tweet", retweeted_status);
    }
    if (quoted_status) {
      quoted_status = format("tweet", quoted_status);
    }
    return {
      created_at,
      id_str,
      full_text,
      display_text_range,
      entities,
      user: { name, screen_name, profile_image_url_https },
      retweet_count,
      favorite_count,
      possibly_sensitive,
      original_created_at,
      localize,
      source_updated_at,
      retweeted_status,
      quoted_status,
    };
  }
  return item;
}
module.exports = format;
