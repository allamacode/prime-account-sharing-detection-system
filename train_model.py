import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def load_data(file_path):
    print("Loading data...")
    df = pd.read_csv(file_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df

def feature_engineering(df):
    print("Engineering features...")
    # Group by user_id to extract features
    features = []
    labels = []
    
    for user_id, user_data in df.groupby('user_id'):
        # Number of unique IPs
        unique_ips = user_data['ip_address'].nunique()
        
        # Number of unique devices
        unique_devices = user_data['device'].nunique()
        
        # Number of unique cities
        unique_cities = user_data['city'].nunique()
        
        # Number of events
        num_events = len(user_data)
        
        # Target label
        label = user_data['is_shared_label'].iloc[0]
        
        features.append({
            'user_id': user_id,
            'unique_ips': unique_ips,
            'unique_devices': unique_devices,
            'unique_cities': unique_cities,
            'num_events': num_events
        })
        labels.append(label)
        
    features_df = pd.DataFrame(features)
    X = features_df.drop('user_id', axis=1)
    y = labels
    return X, y

def train_model():
    df = load_data("simulated_events.csv")
    X, y = feature_engineering(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest model...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))
    
    # Save the model
    joblib.dump(clf, "account_sharing_model.pkl")
    print("Model saved to account_sharing_model.pkl")

if __name__ == "__main__":
    train_model()
