#!/usr/bin/env python3
"""
DentistEnvy Backend - Flask API Server
Dental Practice SEO Comparison Tool
"""

import os
import json
import time
import uuid
import base64
import requests
from threading import Thread
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../../frontend', static_url_path='')
CORS(app)

# Configuration
DATAFORSEO_LOGIN = os.getenv('DATAFORSEO_LOGIN', 'mark@yobi.app')
DATAFORSEO_PASSWORD = os.getenv('DATAFORSEO_PASSWORD', 'd320f2233a4b2d53')
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY', 'AIzaSyDH9oJyDcbuxDwrbD74n6eT74iIrohZ5FE')

# In-memory job storage
jobs = {}

# Key directories for dental practices
DENTAL_DIRECTORIES = [
    {'name': 'Healthgrades', 'domain': 'healthgrades.com', 'importance': 'critical'},
    {'name': 'Zocdoc', 'domain': 'zocdoc.com', 'importance': 'critical'},
    {'name': 'Yelp', 'domain': 'yelp.com', 'importance': 'critical'},
    {'name': 'Facebook', 'domain': 'facebook.com', 'importance': 'critical'},
    {'name': 'Vitals', 'domain': 'vitals.com', 'importance': 'high'},
    {'name': 'WebMD', 'domain': 'doctor.webmd.com', 'importance': 'high'},
    {'name': 'Yellow Pages', 'domain': 'yellowpages.com', 'importance': 'medium'},
    {'name': '1-800-Dentist', 'domain': '1800dentist.com', 'importance': 'medium'},
    {'name': 'Dentistry.com', 'domain': 'dentistry.com', 'importance': 'medium'},
    {'name': 'Smile Guide', 'domain': 'smileguide.com', 'importance': 'low'},
]

# Curated list of high-intent dentist search terms
# These are the most popular keywords people use when searching for a dentist
DENTIST_SEARCH_KEYWORDS = [
    'dentist near me',
    'dental office near me',
    'local dentist',
    'dentist in {city}',
    'emergency dentist near me',
    'walk-in dentist',
    'dentist open on weekends',
    'tooth pain relief',
    'affordable dentist near me',
    'family dentist near me',
    'pediatric dentist near me',
    'cosmetic dentist near me',
    'dental implant dentist',
    'teeth whitening',
    'teeth cleaning',
    'root canal',
    'dental emergency dentist near me',
    "children's dentist",
    'best dentist near me',
    'best dentist in {city}',
]


def get_dataforseo_auth():
    """Get base64 auth header for DataForSEO"""
    credentials = f"{DATAFORSEO_LOGIN}:{DATAFORSEO_PASSWORD}"
    return base64.b64encode(credentials.encode()).decode()


def geocode_address(address):
    """Convert address to lat/lng using Google Geocoding API"""
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": GOOGLE_PLACES_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()

    if data.get('status') != 'OK':
        raise Exception(f"Geocoding failed: {data.get('status')}")

    result = data['results'][0]
    return {
        'lat': result['geometry']['location']['lat'],
        'lng': result['geometry']['location']['lng'],
        'formatted_address': result['formatted_address']
    }


# Practice type to Google Places search keyword mapping
PRACTICE_TYPE_KEYWORDS = {
    'general': 'dentist',
    'pediatric': 'pediatric dentist',
    'oral_surgery': 'oral surgeon',
    'periodontist': 'periodontist',
    'orthodontist': 'orthodontist',
    'prosthodontist': 'prosthodontist'
}


def find_dental_competitors(lat, lng, radius_miles=7, practice_type='general'):
    """Find dental practices near a location using Google Places API"""
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    radius_meters = radius_miles * 1609.34

    # Get the search keyword based on practice type
    search_keyword = PRACTICE_TYPE_KEYWORDS.get(practice_type, 'dentist')
    print(f"  Searching for: {search_keyword}")

    params = {
        "location": f"{lat},{lng}",
        "radius": radius_meters,
        "keyword": search_keyword,
        "type": "dentist",
        "key": GOOGLE_PLACES_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data.get('status') not in ['OK', 'ZERO_RESULTS']:
        raise Exception(f"Places API error: {data.get('status')}")

    competitors = []
    for place in data.get('results', [])[:15]:
        # Get place details for website
        website = get_place_website(place['place_id'])

        if website:  # Only include places with websites
            competitors.append({
                'name': place['name'],
                'address': place.get('vicinity', ''),
                'website': website,
                'domain': extract_domain(website),
                'rating': place.get('rating'),
                'review_count': place.get('user_ratings_total', 0)
            })

    # Sort by review count and return top 5
    competitors.sort(key=lambda x: x['review_count'], reverse=True)
    return competitors[:5]


def get_place_website(place_id):
    """Get website for a place using Place Details API"""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "website",
        "key": GOOGLE_PLACES_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        return data.get('result', {}).get('website')
    except:
        return None


def lookup_practice_reviews(practice_name, address):
    """Look up a practice in Google Places to get their rating and review count"""
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

    # Search for the practice by name and location
    query = f"{practice_name} {address}"
    params = {
        "query": query,
        "key": GOOGLE_PLACES_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if data.get('status') == 'OK' and data.get('results'):
            # Take the first (most relevant) result
            place = data['results'][0]
            result = {
                'name': place.get('name', practice_name),
                'rating': place.get('rating'),
                'review_count': place.get('user_ratings_total', 0),
                'place_id': place.get('place_id'),
                'formatted_address': place.get('formatted_address', '')
            }
            print(f"  Found practice: {result['name']} - {result['rating']} stars, {result['review_count']} reviews")
            return result
        else:
            print(f"  Could not find practice in Google Places: {data.get('status')}")
            return {'name': practice_name, 'rating': None, 'review_count': 0}
    except Exception as e:
        print(f"  Error looking up practice: {e}")
        return {'name': practice_name, 'rating': None, 'review_count': 0}


def extract_domain(url):
    """Extract domain from URL"""
    if not url:
        return None
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url if url.startswith('http') else f'https://{url}')
        domain = parsed.netloc or parsed.path.split('/')[0]
        return domain.replace('www.', '')
    except:
        return url


def get_keyword_rankings(keywords, location_code=2840):
    """Get keyword rankings from DataForSEO SERP API - one request per keyword"""
    url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
    headers = {
        "Authorization": f"Basic {get_dataforseo_auth()}",
        "Content-Type": "application/json"
    }

    results = []

    for kw in keywords:
        try:
            # DataForSEO SERP API only allows one task at a time
            payload = [{"keyword": kw, "location_code": location_code, "language_code": "en", "depth": 20}]
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()

            rankings = []
            task = data.get('tasks', [{}])[0]
            if task.get('status_code') == 20000 and task.get('result'):
                for item in task['result'][0].get('items', []):
                    if item.get('type') == 'organic':
                        rankings.append({
                            'position': item.get('rank_absolute'),
                            'domain': item.get('domain', '').replace('www.', ''),
                            'title': item.get('title', '')
                        })
                print(f"  SERP for '{kw}': {len(rankings)} organic results")
            else:
                print(f"  SERP error for '{kw}': {task.get('status_message', 'Unknown')}")

            results.append({'keyword': kw, 'rankings': rankings})

        except Exception as e:
            print(f"  SERP exception for '{kw}': {e}")
            results.append({'keyword': kw, 'rankings': []})

    return results


def get_backlinks_summary(domains):
    """Get backlinks summary from DataForSEO - one request per domain"""
    url = "https://api.dataforseo.com/v3/backlinks/summary/live"
    headers = {
        "Authorization": f"Basic {get_dataforseo_auth()}",
        "Content-Type": "application/json"
    }

    results = []
    for domain in domains:
        try:
            # DataForSEO Backlinks API only allows one domain per request
            response = requests.post(url, headers=headers, json=[{"target": domain}])
            data = response.json()

            task = data.get('tasks', [{}])[0]
            if task.get('status_code') == 20000 and task.get('result'):
                r = task['result'][0]
                results.append({
                    'domain': domain,
                    'rank': r.get('rank', 0),
                    'backlinks': r.get('backlinks', 0),
                    'referring_domains': r.get('referring_domains', 0)
                })
                print(f"  Backlinks for {domain}: rank={r.get('rank', 0)}")
            else:
                print(f"  Backlinks error for {domain}: {task.get('status_message', 'Unknown')}")
                results.append({
                    'domain': domain,
                    'rank': 0,
                    'backlinks': 0,
                    'referring_domains': 0
                })
        except Exception as e:
            print(f"  Backlinks exception for {domain}: {e}")
            results.append({
                'domain': domain,
                'rank': 0,
                'backlinks': 0,
                'referring_domains': 0
            })

    return results


def get_onpage_analysis(urls):
    """Get on-page SEO analysis from DataForSEO"""
    url = "https://api.dataforseo.com/v3/on_page/instant_pages"
    headers = {
        "Authorization": f"Basic {get_dataforseo_auth()}",
        "Content-Type": "application/json"
    }

    tasks = [{"url": u, "enable_javascript": True} for u in urls]

    response = requests.post(url, headers=headers, json=tasks)
    data = response.json()

    results = []
    for i, task in enumerate(data.get('tasks', [])):
        if task.get('status_code') == 20000 and task.get('result'):
            items = task['result'][0].get('items', [])
            if items:
                item = items[0]
                results.append({
                    'url': urls[i],
                    'score': item.get('onpage_score', 0),
                    'title': item.get('meta', {}).get('title', ''),
                    'status_code': item.get('status_code', 0)
                })
            else:
                results.append({'url': urls[i], 'score': 0, 'title': '', 'status_code': 0})
        else:
            results.append({'url': urls[i], 'score': 0, 'title': '', 'status_code': 0})

    return results


def check_directory_listings(practice_name, city, state=''):
    """Check if a practice is listed on key dental directories using SERP searches"""
    url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
    headers = {
        "Authorization": f"Basic {get_dataforseo_auth()}",
        "Content-Type": "application/json"
    }

    results = []
    location_str = f"{city} {state}".strip()

    for directory in DENTAL_DIRECTORIES:
        try:
            # Search for the practice on this specific directory
            search_query = f'"{practice_name}" site:{directory["domain"]}'
            payload = [{
                "keyword": search_query,
                "location_name": "United States",
                "language_code": "en",
                "depth": 10
            }]

            response = requests.post(url, headers=headers, json=payload)
            data = response.json()

            listing_found = False
            listing_url = None
            listing_title = None

            task = data.get('tasks', [{}])[0]
            if task.get('status_code') == 20000 and task.get('result'):
                items = task['result'][0].get('items', [])
                for item in items:
                    if item.get('type') == 'organic':
                        # Found a listing
                        listing_found = True
                        listing_url = item.get('url', '')
                        listing_title = item.get('title', '')
                        break

            results.append({
                'directory': directory['name'],
                'domain': directory['domain'],
                'importance': directory['importance'],
                'found': listing_found,
                'url': listing_url,
                'title': listing_title
            })

            print(f"  Directory {directory['name']}: {'Found' if listing_found else 'Not found'}")

        except Exception as e:
            print(f"  Directory check error for {directory['name']}: {e}")
            results.append({
                'directory': directory['name'],
                'domain': directory['domain'],
                'importance': directory['importance'],
                'found': False,
                'url': None,
                'title': None,
                'error': str(e)
            })

    return results


def calculate_scores(practice_data, competitors, keywords, practice_rankings):
    """Calculate SEO scores"""
    # Keyword score
    keyword_score = 0
    max_score = len(keywords) * 100

    for kw in keywords:
        rank = practice_rankings.get(kw)
        if rank:
            if rank <= 3:
                keyword_score += 100
            elif rank <= 10:
                keyword_score += 70
            elif rank <= 20:
                keyword_score += 40
            else:
                keyword_score += 10

    keywords_normalized = int((keyword_score / max_score) * 100) if max_score > 0 else 0

    # Backlinks score
    all_ranks = [practice_data['backlinks']['rank']] + [c['backlinks']['rank'] for c in competitors]
    max_rank = max(all_ranks) if all_ranks else 1
    backlinks_normalized = int((practice_data['backlinks']['rank'] / max_rank) * 100) if max_rank > 0 else 0

    # Technical score
    technical_normalized = int(practice_data['onpage']['score'])

    # Overall score
    overall = int(keywords_normalized * 0.4 + backlinks_normalized * 0.3 + technical_normalized * 0.3)

    return {
        'overall': overall,
        'keywords': keywords_normalized,
        'backlinks': backlinks_normalized,
        'technical': technical_normalized
    }


def generate_recommendations(practice_data, competitors, practice_rankings, keywords, directory_listings=None):
    """Generate SEO recommendations"""
    recommendations = []

    # Check domain authority
    avg_rank = sum(c['backlinks']['rank'] for c in competitors) / len(competitors) if competitors else 0
    if practice_data['backlinks']['rank'] < avg_rank * 0.5:
        recommendations.append({
            'priority': 'high',
            'category': 'backlinks',
            'title': 'Build Domain Authority',
            'description': f"Your domain rank ({practice_data['backlinks']['rank']}) is below the competitor average ({int(avg_rank)}). Focus on acquiring quality backlinks from dental directories and local business listings."
        })

    # Check technical SEO
    if practice_data['onpage']['score'] < 70:
        recommendations.append({
            'priority': 'critical',
            'category': 'technical',
            'title': 'Improve Technical SEO',
            'description': f"Your on-page SEO score is {int(practice_data['onpage']['score'])}/100. Address technical issues like page speed, meta tags, and mobile optimization."
        })

    # Check keyword rankings
    top10_count = sum(1 for rank in practice_rankings.values() if rank and rank <= 10)
    if top10_count == 0:
        recommendations.append({
            'priority': 'critical',
            'category': 'keywords',
            'title': 'No Keywords in Top 10',
            'description': 'You have no dental keywords ranking in the top 10 search results. Focus on optimizing your homepage and service pages for key dental terms.'
        })
    elif top10_count < 3:
        recommendations.append({
            'priority': 'high',
            'category': 'keywords',
            'title': 'Improve Keyword Rankings',
            'description': f'You have only {top10_count} keywords in the top 10. Create dedicated landing pages for more dental services.'
        })

    # Check referring domains
    avg_referring = sum(c['backlinks']['referring_domains'] for c in competitors) / len(competitors) if competitors else 0
    if practice_data['backlinks']['referring_domains'] < avg_referring * 0.5:
        recommendations.append({
            'priority': 'medium',
            'category': 'backlinks',
            'title': 'Increase Referring Domains',
            'description': f"You have {practice_data['backlinks']['referring_domains']} referring domains vs competitor average of {int(avg_referring)}. Pursue link building through local partnerships."
        })

    # Check Google review count
    practice_reviews = practice_data.get('review_count', 0)
    competitor_reviews = [c.get('review_count', 0) for c in competitors if c.get('review_count')]
    if competitor_reviews:
        avg_reviews = sum(competitor_reviews) / len(competitor_reviews)
        max_reviews = max(competitor_reviews)

        if practice_reviews == 0:
            recommendations.append({
                'priority': 'critical',
                'category': 'reviews',
                'title': 'No Google Reviews Found',
                'description': f"We couldn't find Google reviews for your practice. Your competitors average {int(avg_reviews)} reviews. Claim your Google Business Profile and start asking satisfied patients for reviews."
            })
        elif practice_reviews < avg_reviews * 0.5:
            recommendations.append({
                'priority': 'high',
                'category': 'reviews',
                'title': 'Increase Google Reviews',
                'description': f"You have {practice_reviews} Google reviews vs competitor average of {int(avg_reviews)}. Reviews are a major local ranking factor. Implement a systematic review request process for satisfied patients."
            })
        elif practice_reviews < avg_reviews:
            recommendations.append({
                'priority': 'medium',
                'category': 'reviews',
                'title': 'Build More Reviews',
                'description': f"You have {practice_reviews} reviews, below the competitor average of {int(avg_reviews)}. The top competitor has {max_reviews} reviews. Continue encouraging happy patients to leave reviews."
            })

    # Check Google rating
    practice_rating = practice_data.get('rating')
    competitor_ratings = [c.get('rating') for c in competitors if c.get('rating')]
    if practice_rating and competitor_ratings:
        avg_rating = sum(competitor_ratings) / len(competitor_ratings)

        if practice_rating < 4.0:
            recommendations.append({
                'priority': 'critical',
                'category': 'reviews',
                'title': 'Improve Google Rating',
                'description': f"Your {practice_rating}-star rating is below the 4.0 threshold that patients look for. Focus on patient experience and address any negative reviews professionally."
            })
        elif practice_rating < avg_rating - 0.3:
            recommendations.append({
                'priority': 'high',
                'category': 'reviews',
                'title': 'Boost Your Rating',
                'description': f"Your {practice_rating}-star rating is below the competitor average of {avg_rating:.1f} stars. Encourage your happiest patients to share their experiences online."
            })

    # Check directory listings
    if directory_listings:
        missing_critical = [d for d in directory_listings if not d['found'] and d['importance'] == 'critical']
        missing_high = [d for d in directory_listings if not d['found'] and d['importance'] == 'high']
        missing_medium = [d for d in directory_listings if not d['found'] and d['importance'] == 'medium']
        total_found = sum(1 for d in directory_listings if d['found'])
        total_dirs = len(directory_listings)

        if missing_critical:
            dir_names = ', '.join([d['directory'] for d in missing_critical])
            recommendations.append({
                'priority': 'critical',
                'category': 'citations',
                'title': 'Missing Critical Directory Listings',
                'description': f"Your practice is not listed on these important directories: {dir_names}. These are high-traffic sites where patients search for dentists. Claim your listings immediately."
            })

        if missing_high:
            dir_names = ', '.join([d['directory'] for d in missing_high])
            recommendations.append({
                'priority': 'high',
                'category': 'citations',
                'title': 'Missing Key Directory Listings',
                'description': f"Consider adding your practice to: {dir_names}. These directories help improve your local SEO and online visibility."
            })

        if total_found < total_dirs * 0.5:
            recommendations.append({
                'priority': 'high',
                'category': 'citations',
                'title': 'Low Directory Presence',
                'description': f"You're only listed on {total_found} of {total_dirs} key directories. Building more citations helps Google verify your business information and improves local rankings."
            })

    return recommendations


def run_analysis(job_id, practice_name, address, website_url, competitor_mode, practice_type='general', manual_competitors=None):
    """Run the full SEO analysis"""
    job = jobs[job_id]

    try:
        practice_domain = extract_domain(website_url)

        # Step 1: Get competitors and practice reviews
        job['progress'] = 10
        job['message'] = 'Finding competitors...'

        # Look up subject practice in Google Places for reviews
        practice_reviews = lookup_practice_reviews(practice_name, address)

        if competitor_mode == 'manual' and manual_competitors:
            competitor_domains = [extract_domain(url) for url in manual_competitors]
            competitors = [{'name': d, 'domain': d, 'website': f'https://{d}', 'rating': None, 'review_count': 0} for d in competitor_domains]
        else:
            geo = geocode_address(address)
            competitors = find_dental_competitors(geo['lat'], geo['lng'], practice_type=practice_type)

        competitor_domains = [c['domain'] for c in competitors if c.get('domain')]

        # Extract city from address (usually the second part: "123 Main St, Austin, TX" -> "Austin")
        address_parts = [p.strip() for p in address.split(',')]
        if len(address_parts) >= 2:
            # City is typically the second part (after street address)
            city = address_parts[1].strip()
            # Remove state abbreviation if present (e.g., "Austin TX" -> "Austin")
            city_words = city.split()
            if len(city_words) > 1 and len(city_words[-1]) == 2 and city_words[-1].isupper():
                city = ' '.join(city_words[:-1])
        else:
            # Fallback: use the whole address or first word
            city = address_parts[0].strip()

        print(f"  Extracted city: {city}")

        # Step 2: Build keyword list from curated search terms
        keywords = [kw.replace('{city}', city) for kw in DENTIST_SEARCH_KEYWORDS]
        print(f"  Using {len(keywords)} keywords for ranking analysis")

        # Step 3: Get backlinks data
        job['progress'] = 20
        job['message'] = 'Analyzing domain authority...'

        all_domains = [practice_domain] + competitor_domains
        backlinks_data = get_backlinks_summary(all_domains)

        # Step 4: Get on-page SEO
        job['progress'] = 40
        job['message'] = 'Analyzing technical SEO...'

        all_urls = [website_url] + [f'https://{d}' for d in competitor_domains]
        onpage_data = get_onpage_analysis(all_urls)

        # Step 5: Get keyword rankings
        job['progress'] = 50
        job['message'] = 'Checking keyword rankings...'

        keyword_results = get_keyword_rankings(keywords)

        # Step 6: Check directory listings
        job['progress'] = 75
        job['message'] = 'Checking directory listings...'

        directory_listings = check_directory_listings(practice_name, city)

        # Process rankings
        practice_rankings = {}
        competitor_rankings = {d: {} for d in competitor_domains}

        for result in keyword_results:
            for ranking in result['rankings']:
                domain = ranking['domain']
                if domain == practice_domain:
                    practice_rankings[result['keyword']] = ranking['position']
                elif domain in competitor_rankings:
                    competitor_rankings[domain][result['keyword']] = ranking['position']

        # Build practice data
        practice_data = {
            'name': practice_name,
            'domain': practice_domain,
            'website': website_url,
            'backlinks': backlinks_data[0] if backlinks_data else {'rank': 0, 'backlinks': 0, 'referring_domains': 0},
            'onpage': onpage_data[0] if onpage_data else {'score': 0, 'title': ''},
            'rankings': practice_rankings,
            'rating': practice_reviews.get('rating'),
            'review_count': practice_reviews.get('review_count', 0)
        }

        # Build competitor data
        competitors_data = []
        for i, comp in enumerate(competitors):
            comp_data = {
                'name': comp.get('name', comp['domain']),
                'domain': comp['domain'],
                'website': comp.get('website', f"https://{comp['domain']}"),
                'backlinks': backlinks_data[i + 1] if i + 1 < len(backlinks_data) else {'rank': 0, 'backlinks': 0, 'referring_domains': 0},
                'onpage': onpage_data[i + 1] if i + 1 < len(onpage_data) else {'score': 0, 'title': ''},
                'rankings': competitor_rankings.get(comp['domain'], {}),
                'rating': comp.get('rating'),
                'review_count': comp.get('review_count', 0)
            }
            competitors_data.append(comp_data)

        # Calculate scores
        job['progress'] = 90
        job['message'] = 'Generating report...'

        scores = calculate_scores(practice_data, competitors_data, keywords, practice_rankings)
        recommendations = generate_recommendations(practice_data, competitors_data, practice_rankings, keywords, directory_listings)

        # Build keyword comparisons
        keyword_data = []
        for kw in keywords:
            practice_rank = practice_rankings.get(kw)
            best_competitor = None
            best_rank = None

            for comp in competitors_data:
                comp_rank = comp['rankings'].get(kw)
                if comp_rank and (best_rank is None or comp_rank < best_rank):
                    best_rank = comp_rank
                    best_competitor = comp['name']

            keyword_data.append({
                'keyword': kw,
                'practiceRank': practice_rank,
                'bestCompetitorRank': best_rank,
                'bestCompetitor': best_competitor
            })

        # Calculate keyword insights
        # Top 5 keywords they rank for (sorted by best rank)
        ranked_keywords = [kw for kw in keyword_data if kw['practiceRank']]
        ranked_keywords.sort(key=lambda x: x['practiceRank'])
        top5_ranking = ranked_keywords[:5]

        # Top 5 keywords to improve (not ranking or ranking poorly 11+)
        # Prioritize: not ranking at all first, then poor rankings
        not_ranking = [kw for kw in keyword_data if not kw['practiceRank']]
        poor_ranking = [kw for kw in keyword_data if kw['practiceRank'] and kw['practiceRank'] > 10]
        poor_ranking.sort(key=lambda x: x['practiceRank'])

        # Combine: first those not ranking, then poor performers
        to_improve = not_ranking + poor_ranking
        top5_improve = to_improve[:5]

        keyword_summary = {
            'totalKeywords': len(keywords),
            'rankingCount': len(ranked_keywords),
            'top5Ranking': top5_ranking,
            'top5Improve': top5_improve
        }

        # Complete
        job['status'] = 'completed'
        job['progress'] = 100
        job['message'] = 'Analysis complete!'
        job['result'] = {
            'id': job_id,
            'practiceName': practice_name,
            'practiceWebsite': website_url,
            'scores': scores,
            'practiceData': practice_data,
            'competitors': competitors_data,
            'recommendations': recommendations,
            'keywordData': keyword_data,
            'keywordSummary': keyword_summary,
            'directoryListings': directory_listings
        }

    except Exception as e:
        job['status'] = 'failed'
        job['error'] = str(e)
        print(f"Analysis error: {e}")


# Routes

@app.route('/')
def index():
    """Serve the frontend"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/embed.js')
def embed_js():
    """Serve the embeddable widget JavaScript"""
    return send_from_directory(app.static_folder, 'embed.js', mimetype='application/javascript')


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'DentistEnvy API'})


@app.route('/api/analysis/start', methods=['POST'])
def start_analysis():
    """Start a new SEO analysis"""
    data = request.json

    practice_name = data.get('practiceName')
    address = data.get('address')
    website_url = data.get('websiteUrl')
    practice_type = data.get('practiceType', 'general')
    competitor_mode = data.get('competitorMode', 'auto')
    manual_competitors = data.get('manualCompetitors', [])

    if not all([practice_name, address, website_url]):
        return jsonify({'error': 'Missing required fields'}), 400

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        'status': 'processing',
        'progress': 0,
        'message': 'Starting analysis...',
        'result': None,
        'error': None
    }

    # Run analysis in background thread
    thread = Thread(target=run_analysis, args=(job_id, practice_name, address, website_url, competitor_mode, practice_type, manual_competitors))
    thread.start()

    return jsonify({'jobId': job_id, 'status': 'processing'})


@app.route('/api/analysis/<job_id>/status')
def get_status(job_id):
    """Get analysis status"""
    job = jobs.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    return jsonify({
        'jobId': job_id,
        'status': job['status'],
        'progress': job['progress'],
        'progressMessage': job['message']
    })


@app.route('/api/analysis/<job_id>/report')
def get_report(job_id):
    """Get completed analysis report"""
    job = jobs.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    if job['status'] == 'failed':
        return jsonify({'error': job['error']}), 500

    if job['status'] != 'completed':
        return jsonify({'message': 'Analysis still in progress', 'status': job['status']}), 202

    return jsonify(job['result'])


@app.route('/api/analysis/discover-competitors', methods=['POST'])
def discover_competitors():
    """Discover competitors for preview"""
    data = request.json
    address = data.get('address')

    if not address:
        return jsonify({'error': 'Address is required'}), 400

    try:
        geo = geocode_address(address)
        competitors = find_dental_competitors(geo['lat'], geo['lng'])
        return jsonify({'location': geo, 'competitors': competitors})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════════╗
    ║         DentistEnvy API Server            ║
    ╠═══════════════════════════════════════════╣
    ║  Status:  Running                         ║
    ║  URL:     http://localhost:5001           ║
    ║  Health:  http://localhost:5001/health    ║
    ╚═══════════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
